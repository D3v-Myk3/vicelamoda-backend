import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { generateSKU } from "../helpers/sku.helpers";
import { BrandModel } from "../models/mongoose/Brand.model";
import { CategoryModel } from "../models/mongoose/Category.model";
import { ProductModel, ProductSize } from "../models/mongoose/Product.model";
import {
  fetchProductByBarcodeModel,
  fetchProductsModel,
  fetchSingleProductModel,
} from "../models/product.models";
import { CreateProductFormType } from "../schemas/product.zod.schemas";
import { CustomError, DefaultErrorReturn } from "../types/error.types";
import { ServiceFunctionParamType } from "../types/general.types";
import {
  allowedProductSizeVariation,
  CreateProductType,
  FetchProductByBarcodeType,
  FetchProductsType,
  FetchSingleProductType,
  ProductTblType,
  sizeVariations,
  UpdateProductServiceParam,
} from "../types/product.type";
import { StoreTblType } from "../types/store.types";

export const createProductService: ServiceFunctionParamType<
  CreateProductType | CreateProductFormType,
  string
> = async (arg, { admin_data, manager_data }) => {
  const source = "CREATE PRODUCT SERVICE";
  logger.info("Starting createProductService", {
    body: arg,
  });
  const params = arg as CreateProductType;

  try {
    const store_id =
      (manager_data?.store as StoreTblType)?._id ?? params.store_id;
    // Validate brand_id exists
    const brand = await BrandModel.findOne({
      brand_id: params.brand_id,
    })
      .lean()
      .exec();

    if (!brand) {
      logger.warn(`Brand not found`, {
        source: `${source} (STAGE 1)`,
        brand_id: params.brand_id,
        status: StatusCodes.BAD_REQUEST,
      });
      throw new CustomError({
        data: null,
        errorMessage: `Brand with ID "${params.brand_id}" not found`,
        source: `${source} (STAGE 1)`,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    // Validate category_id exists
    const category = await CategoryModel.findOne({
      category_id: params.category_id,
    })
      .lean()
      .exec();

    if (!category) {
      logger.warn(`Category not found`, {
        source: `${source} (STAGE 1)`,
        category_id: params.category_id,
        status: StatusCodes.BAD_REQUEST,
      });
      throw new CustomError({
        data: null,
        errorMessage: `Category with ID "${params.category_id}" not found`,
        source: `${source} (STAGE 1)`,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    // Generate Base SKU (for the product document)
    // If variants exist, this is the "parent" SKU. If not, it's the simple product SKU.
    const baseSku = generateSKU(brand.abbreviation, category.abbreviation);

    let productData: CreateProductType = {
      name: params.name,
      sku: baseSku,
      description: params.description ?? null,
      unit: params.unit ?? "pcs",
      category_id: params.category_id ?? null,
      brand_id: params.brand_id ?? null,
      selling_price: Number(params.selling_price) || 0,
      cost_price: Number(params.cost_price) || 0,
      quantity_in_stock: Number(params.quantity_in_stock) || 0,
      has_variants: false,
      variants: [],
      images: [],
    };

    // Handle Images
    if (params.images && Array.isArray(params.images) && params.images.length) {
      productData.images = params.images.map((img: any) => ({
        image_url: img.image_url,
        is_primary: img.is_primary ?? false,
      }));
    }

    // Handle Variants
    if (params.size_variation && params.size_variation.length > 0) {
      productData.has_variants = true;

      for (const sizeData of params.size_variation) {
        if (
          !allowedProductSizeVariation.includes(sizeData.size as ProductSize)
        ) {
          logger.warn(`Invalid size variation`, {
            source: `${source} (STAGE 1)`,
            size_variation: params.size_variation,
            status: StatusCodes.BAD_REQUEST,
          });
          throw new CustomError({
            data: null,
            errorMessage: `Invalid size variation "${sizeData.size}". Allowed values are ${allowedProductSizeVariation.join(
              ", "
            )}.`,
            source: `${source} (STAGE 1)`,
            status: StatusCodes.BAD_REQUEST,
          });
        }

        const sizeInfo = sizeVariations[sizeData.size as ProductSize];

        // Generate Variant SKU
        // We can let the model pre-save hook handle it if we trust it, but pre-generating usually safer for logging/debug.
        // However, the model hook logic I wrote earlier generates SKU if missing.
        // Let's rely on the model or simplistic generation here.
        // Model logic: [productSKU, size, attributes].join("-")
        // We'll pass the size and let the model hook finalize the SKU if needed, OR generate it here.
        // Let's generate it here to be explicit and control uniqueness check if needed.
        // Actually, let's leave SKU empty or minimal and let the model middleware do the heavy lifting as per your provided schema logic?
        // Your schema logic: if (!variant.sku) variant.sku = generateVariantSKU(...)
        // So I will just provide the necessary fields.

        productData.variants.push({
          size: sizeInfo.db_value,
          price: Number(sizeData.selling_price) || 0,
          stock: [{ store_id: store_id!, quantity: 0 }], // Default 0, can be updated via supply
          attributes: sizeData.attributes, // Future: Add color etc. here
          sku: "", // Will be auto-generated by model middleware
        });
      }
    } else {
      // Simple product
      productData.size = ProductSize.STANDARD;
    }

    const createdProduct = await ProductModel.create(productData);

    logger.info(`Product created successfully`, {
      source,
      status: StatusCodes.CREATED,
      product_id: createdProduct.product_id,
    });

    return {
      data: {
        data: createdProduct.product_id, // Return ID
        message: "Product created successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.CREATED,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in product creation`, {
      source: `${source} (ERROR)`,
      personnel: admin_data?.email || manager_data?.email,
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({
        error,
        source: `${source} (ERROR)`,
      }) as DefaultErrorReturn;
    } else {
      return defaultError(`${source} (ERROR)`, error as string);
    }
  }
};

export const fetchProductsService: ServiceFunctionParamType<
  FetchProductsType,
  ProductTblType[]
> = async (params) => {
  const source = "FETCH PRODUCTS SERVICE";
  logger.info("Starting fetchProductsService", {
    body: params,
  });

  try {
    const response = await fetchProductsModel(params, {});

    if (response.errorMessage || response.status >= 300) {
      throw new CustomError({
        data: null,
        errorMessage: response.errorMessage || "Failed to fetch products",
        source: response.source,
        status: response.status,
      });
    }

    logger.info(`Fetch all products completed`, {
      source,
      params: params ?? {},
      found: response.data?.length || 0,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: response.data as ProductTblType[],
        pagination: response.pagination,
        message: "Products fetched successfully",
      },
      errorMessage: null,
      status: StatusCodes.OK,
      source,
    };
  } catch (error: CustomError | unknown) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  }
};

export const fetchProductByBarcodeService: ServiceFunctionParamType<
  FetchProductByBarcodeType,
  ProductTblType
> = async (params) => {
  const source = "FETCH PRODUCT BY BARCODE SERVICE";
  logger.info("Starting fetchProductByBarcodeService", {
    body: params,
  });

  try {
    const response = await fetchProductByBarcodeModel(params, {});

    if (response.errorMessage || response.status >= 300) {
      throw new CustomError({
        data: null,
        errorMessage: response.errorMessage || "Product not found",
        source: response.source,
        status: response.status,
      });
    }

    logger.info(`Fetch product by barcode completed`, {
      source,
      params: params ?? {},
      found: response.data ? 1 : 0,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: response.data as ProductTblType,
        message: "Product fetched successfully",
      },
      errorMessage: null,
      status: StatusCodes.OK,
      source,
    };
  } catch (error: CustomError | unknown) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  }
};

export const fetchSingleProductService: ServiceFunctionParamType<
  FetchSingleProductType,
  ProductTblType
> = async (params) => {
  const source = "FETCH SINGLE PRODUCT SERVICE";
  logger.info("Starting fetchSingleProductService", {
    body: params,
  });

  try {
    const response = await fetchSingleProductModel(params, {});

    if (response.errorMessage || response.status >= 300) {
      throw new CustomError({
        data: null,
        errorMessage: response.errorMessage || "No Product Found",
        source: response.source,
        status: response.status,
      });
    }

    logger.info(`Fetch single product completed`, {
      source,
      params: params ?? {},
      found: response.data ? 1 : 0,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: response.data as ProductTblType,
        message: "Product fetched successfully",
      },
      errorMessage: null,
      status: StatusCodes.OK,
      source,
    };
  } catch (error: CustomError | unknown) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  }
};
export const updateProductService: ServiceFunctionParamType<
  UpdateProductServiceParam,
  ProductTblType
> = async ({ product_id, update_data }, {}) => {
  const source = "UPDATE PRODUCT SERVICE";
  logger.info("Starting updateProductService", {
    product_id,
    update_data,
  });

  try {
    const product = await ProductModel.findOne({ product_id });

    if (!product) {
      throw new CustomError({
        data: null,
        errorMessage: "Product not found",
        source,
        status: StatusCodes.NOT_FOUND,
      });
    }

    // Update basic fields
    if (update_data.name) product.name = update_data.name;
    if (update_data.description) product.description = update_data.description;
    if (update_data.unit) product.unit = update_data.unit as any;
    if (update_data.category_id) product.category_id = update_data.category_id;
    if (update_data.brand_id) product.brand_id = update_data.brand_id;
    if (update_data.status) product.status = update_data.status as any;

    if (update_data.cost_price !== undefined)
      product.cost_price = Number(update_data.cost_price);
    if (update_data.selling_price !== undefined)
      product.selling_price = Number(update_data.selling_price);

    // Handle Variants Update
    if (update_data.size_variation && update_data.size_variation.length > 0) {
      // Ensure has_variants is true if we are adding variants
      product.has_variants = true;

      for (const varInput of update_data.size_variation) {
        const sizeInfo = sizeVariations[varInput.size as ProductSize];
        const existingVariantIndex = product.variants.findIndex(
          (v) => v.size === sizeInfo.db_value
        );

        if (existingVariantIndex > -1) {
          // Update existing variant
          product.variants[existingVariantIndex].price = Number(
            varInput.selling_price
          );
          if (varInput.attributes) {
            product.variants[existingVariantIndex].attributes =
              varInput.attributes;
          }
          // Note: Stock is typically not updated here, but via supply/sales.
        } else {
          // Add new variant
          // We rely on pre-save hook for SKU generation if we pass limited data,
          // but our interface requires strict typing.
          // Let's create the variant structure.
          /* const newVariant: any = {
            size: sizeInfo.db_value,
            price: Number(varInput.selling_price),
            sku: "", // will be generated
            stock: 0,
            stocks: [], // Initialize empty store stocks
            attributes: varInput.attributes || [],
            status: "active",
          }; */

          // Using the user's defined structure or Mongoose push
          product.variants.push({
            size: sizeInfo.db_value,
            price: Number(varInput.selling_price),
            sku: "", // Hook generates this
            attributes: varInput.attributes || [],
            stocks: [], // Hook/logic handles this? User added stock: {store_id, qty}[]
            // We initialize with empty stock for new variants in update
            status: "active",
          } as any);
        }
      }
    }

    // Handle Image Updates if provided (Replace or Append? Usually replace is safer for simplified API)
    if (
      update_data.images &&
      Array.isArray(update_data.images) &&
      update_data.images.length
    ) {
      product.images = update_data.images.map((img: any) => ({
        image_url: img.image_url,
        is_primary: img.is_primary ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as any;
    }

    await product.save();

    logger.info(`Product updated successfully`, {
      source,
      product_id,
      status: StatusCodes.OK,
    });

    // Re-fetch to get clean object
    const updatedProduct = await ProductModel.findOne({ product_id });

    return {
      data: {
        data: updatedProduct as unknown as ProductTblType,
        message: "Product updated successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  }
};

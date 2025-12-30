import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { generateSKU } from "../helpers/sku.helpers";
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
  CreateProductType,
  FetchProductByBarcodeType,
  FetchProductsType,
  FetchSingleProductType,
  ProductTblType,
  UpdateProductServiceParam,
} from "../types/product.type";

/**
 * Helper function to filter product data before returning to the user.
 * It removes sensitive information like cost_price.
 */
const filterProductData = (products: ProductTblType[]): ProductTblType[] => {
  return products.map((product) => {
    // Clone to avoid mutating original if necessary, but lean() already gives us a POJO usually.
    const filteredProduct = { ...product };

    // Remove sensitive root fields
    delete (filteredProduct as any).cost_price;

    // Remove sensitive fields from variants
    if (filteredProduct.variants) {
      filteredProduct.variants = filteredProduct.variants.map((variant) => ({
        ...variant,
        materials: variant.materials.map((material) => {
          const filteredMaterial = { ...material };
          delete (filteredMaterial as any).cost_price;
          return filteredMaterial;
        }),
      })) as any;
    }

    return filteredProduct;
  }) as ProductTblType[];
};

export const createProductService: ServiceFunctionParamType<
  CreateProductType | CreateProductFormType,
  string
> = async (arg, { admin_data, manager_data }) => {
  const source = "CREATE PRODUCT SERVICE";
  logger.info("Starting createProductService", {
    body: arg,
  });
  const params = arg as CreateProductType;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate brand_id exists
    /* const brand = await BrandModel.findOne({
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
    } */

    // Fetch stores
    /* const stores = await StoreModel.find().lean().exec();

    if (!stores) {
      logger.warn(`Stores not found`, {
        source: `${source} (STAGE 1)`,
        category_id: params.category_id,
        status: StatusCodes.BAD_REQUEST,
      });
      throw new CustomError({
        data: null,
        errorMessage: `Stores not found`,
        source: `${source} (STAGE 1)`,
        status: StatusCodes.BAD_REQUEST,
      });
    } */

    // Validate category_id exists
    const category = await CategoryModel.findOne({
      _id: params.category_id,
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
    const baseSku = generateSKU(category.abbreviation);

    let productData: CreateProductType = {
      name: params.name,
      sku: baseSku,
      description: params.description ?? null,
      unit: params.unit ?? "pcs",
      category_id: params.category_id ?? null,
      // store_id: params.store_id,
      // brand_id: params.brand_id ?? null,
      cost_price: Number(params.cost_price) || 0,
      selling_price: Number(params.selling_price) || 0,
      quantity_in_stock: Number(params.quantity_in_stock) || 0,
      has_variants: false,
      variants: [],
      images: [],
      stocks:
        params.stocks && params.stocks.length > 0
          ? params.stocks.map((s) => ({
              store_id: s.store_id as any,
              stock: Number(s.stock) || 0,
            }))
          : [],
    } as any;

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
      productData.variants = params.size_variation.map((sizeData) => ({
        size: sizeData.size as ProductSize,
        sku: "", // Will be auto-generated by model middleware
        materials: sizeData.materials.map((mat) => ({
          name: mat.name,
          sku: "", // Will be auto-generated by model middleware
          price: Number(mat.price) || 0,
          cost_price: mat.cost_price ? Number(mat.cost_price) : undefined,
          colors: mat.colors.map((color) => ({
            name: color.name,
            sku: "", // Will be auto-generated by model middleware
            image_url: color.image_url || undefined,
            stocks:
              color.stocks && color.stocks.length > 0
                ? color.stocks.map((st) => ({
                    store_id: st.store_id as any,
                    stock: Number(st.stock) || 0,
                  }))
                : [],
          })),
        })),
      }));
    } else {
      // Simple product
      productData.has_variants = false;
    }

    console.log(productData);

    const createdProduct = await ProductModel.create(productData);

    logger.info(`Product created successfully`, {
      source,
      status: StatusCodes.CREATED,
      product_id: createdProduct.product_id,
    });

    session.commitTransaction();
    // session.endSession();

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
    session.abortTransaction();

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
  } finally {
    session.endSession();
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
        data: filterProductData(response.data as ProductTblType[]),
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
> = async (params, { admin_data }) => {
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
        data: admin_data
          ? response.data
          : filterProductData([response.data as ProductTblType])[0],
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
> = async (params, { admin_data }) => {
  const source = "FETCH SINGLE PRODUCT SERVICE";
  logger.info("Starting fetchSingleProductService", {
    body: params,
  });

  try {
    const response = await fetchSingleProductModel(
      { ...params, constraints: { category: true } },
      {}
    );

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

    console.log(response);

    return {
      data: {
        data: admin_data
          ? response.data
          : filterProductData([response.data as ProductTblType])[0],
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
    const product = await ProductModel.findOne({ _id: product_id });

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
      product.cost_price = update_data.has_variants
        ? 0
        : Number(update_data.cost_price);
    if (update_data.selling_price !== undefined)
      product.selling_price = update_data.has_variants
        ? 0
        : Number(update_data.selling_price);

    // Handle Variants Update
    if (update_data.size_variation && update_data.size_variation.length > 0) {
      product.has_variants = true;

      // Simplification: In a real-world scenario, you might want deep reconciliation.
      // For now, we'll map the incoming hierarchical data.
      product.variants = update_data.size_variation.map((sizeData) => ({
        size: sizeData.size as ProductSize,
        sku: "", // Will be auto-generated
        materials: sizeData.materials.map((mat) => ({
          name: mat.name,
          sku: "", // Will be auto-generated
          price: Number(mat.price) || 0,
          cost_price: mat.cost_price ? Number(mat.cost_price) : undefined,
          colors: mat.colors.map((color) => ({
            name: color.name,
            sku: "", // Will be auto-generated
            image_url: color.image_url || undefined,
            stocks: color.stocks.map((st) => ({
              store_id: st.store_id,
              stock: Number(st.stock) || 0,
            })),
          })),
        })),
      })) as any;
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
    const updatedProduct = await ProductModel.findOne({ _id: product_id });

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
export const deleteProductService: ServiceFunctionParamType<
  string,
  null
> = async (product_id, { admin_data, manager_data }) => {
  const source = "DELETE PRODUCT SERVICE";
  logger.info("Starting deleteProductService", {
    product_id,
  });

  try {
    const product = await ProductModel.findOneAndDelete({ _id: product_id });

    if (!product) {
      throw new CustomError({
        data: null,
        errorMessage: "Product not found",
        source,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    logger.info(`Product deleted successfully`, {
      source,
      product_id,
      personnel: admin_data?.email || manager_data?.email,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: null,
        message: "Product deleted successfully",
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

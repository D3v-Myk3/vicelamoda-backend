import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { ProductModel, SupplyModel } from "../models/mongoose";
import { StoreModel } from "../models/mongoose/Store.model";
import {
  fetchSingleSupplyModel,
  fetchSuppliesModel,
} from "../models/supply.models";
import { CreateSupplyFormType } from "../schemas/supply.zod.schemas";
import { CustomError, DefaultErrorReturn } from "../types/error.types";
import { ServiceFunctionParamType } from "../types/general.types";
import { ProductTblType } from "../types/product.type";
import {
  FetchSingleSupplyType,
  FetchSuppliesType,
  SupplyTblType,
} from "../types/supply.type";

export const createSupplyService: ServiceFunctionParamType<
  CreateSupplyFormType,
  SupplyTblType
> = async (params, { admin_data, manager_data }) => {
  const source = "CREATE SUPPLY SERVICE";
  logger.info("Starting createSupplyService", {
    body: params,
  });

  try {
    const supply_store_id = manager_data?.store || params.store_id;
    const recorded_by = manager_data?.user_id || admin_data?.user_id;

    if (!supply_store_id) {
      throw new CustomError({
        data: null,
        errorMessage: "Store ID is required",
        source,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    if (!recorded_by) {
      throw new CustomError({
        data: null,
        errorMessage: "User ID is required",
        source,
        status: StatusCodes.UNAUTHORIZED,
      });
    }

    // Validate store exists
    const store = await StoreModel.findOne({
      store_id: supply_store_id,
    })
      .lean()
      .exec();

    if (!store) {
      logger.warn(`Store not found`, {
        source: `${source} (STAGE 1)`,
        store_id: supply_store_id,
        status: StatusCodes.BAD_REQUEST,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Invalid Store",
        source: `${source} (STAGE 1)`,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    // Prepare data for model layer
    /* const createSupplyData: CreateSupplyType = {
      ...params,
      recorded_by,
    }; */

    // const product_data: ProductTblType[] = [];
    const products = await Promise.all(
      params.items.map(async (item) => {
        let variant_sku: string | undefined;
        let variant_name: string | undefined;

        // If variant_sku is provided, validate and get variant info
        if (item.variant_sku) {
          const product = await ProductModel.findOne<ProductTblType>({
            product_id: item.product_id,
          })
            .lean()
            .exec();

          if (!product) {
            throw new CustomError({
              data: null,
              errorMessage: `Product ${item.product_id} not found`,
              source,
              status: StatusCodes.BAD_REQUEST,
            });
          }

          // product_data.push(product as unknown as ProductTblType);

          // Find the variant by SKU
          const variant = product.variants?.find(
            (v) => v.sku === item.variant_sku
          );

          if (!variant) {
            throw new CustomError({
              data: null,
              errorMessage: `Variant with SKU ${item.variant_sku} not found for product ${item.product_id}`,
              source,
              status: StatusCodes.BAD_REQUEST,
            });
          }

          variant_sku = variant.sku;
          variant_name = `${product.name} - ${variant.size}${
            variant.attributes?.length
              ? ` (${variant.attributes.map((a) => a.value).join(", ")})`
              : ""
          }`;
        }

        return {
          product_id: item.product_id,
          quantity: item.quantity,
          date_supplied: new Date(params.date_supplied),
          variant_sku,
          variant_name,
          // product_data,
        };
      })
    );

    // Create supply with products embedded
    const supplyData: any = {
      supplier_name: params.supplier_name,
      supplier_contact: params.supplier_contact,
      store_id: params.store_id,
      recorded_by,
      date_supplied: new Date(params.date_supplied),
      products,
    };

    const supply = await SupplyModel.create(supplyData);

    // Update product stock for each item (handle variants)
    for (const item of params.items) {
      const product = await ProductModel.findOne({
        product_id: item.product_id,
      }).exec();
      /* const product = product_data.find(
        (p) => p.product_id === item.product_id
      ); */

      if (!product) {
        throw new CustomError({
          data: null,
          errorMessage: `Product ${item.product_id} not found`,
          source,
          status: StatusCodes.BAD_REQUEST,
        });
      }

      // Validate variant_sku usage
      if (product.has_variants && !item.variant_sku) {
        throw new CustomError({
          data: null,
          errorMessage: `Product ${item.product_id} has variants. variant_sku is required.`,
          source,
          status: StatusCodes.BAD_REQUEST,
        });
      }

      if (!product.has_variants && item.variant_sku) {
        throw new CustomError({
          data: null,
          errorMessage: `Product ${item.product_id} does not have variants. variant_sku should not be provided.`,
          source,
          status: StatusCodes.BAD_REQUEST,
        });
      }

      if (item.variant_sku && product.has_variants) {
        // Update variant stock
        const variantIndex = product.variants.findIndex(
          (v) => v.sku === item.variant_sku
        );

        if (variantIndex === -1) {
          throw new CustomError({
            data: null,
            errorMessage: `Variant with SKU ${item.variant_sku} not found`,
            source,
            status: StatusCodes.BAD_REQUEST,
          });
        }

        const variant = product.variants[variantIndex];
        const storeStockIndex = variant.stocks.findIndex(
          (s) => s.store_id === params.store_id
        );

        if (storeStockIndex >= 0) {
          // Update existing store stock
          variant.stocks[storeStockIndex].stock += item.quantity;
        } else {
          // Add new store stock entry
          variant.stocks.push({
            store_id: params.store_id,
            stock: item.quantity,
          });
        }

        // Mark variant as modified
        product.markModified("variants");
        await product.save();
      } else {
        // Update product-level stock (non-variant products)
        product.quantity_in_stock += item.quantity;
        await product.save();
      }
    }

    // Re-fetch the created supply
    // Note: products is an embedded array, so we can't populate it
    // The product_id, variant_sku, and variant_name are already stored in the embedded document
    const created = await SupplyModel.findById(supply._id).lean().exec();

    logger.info(`Supply created successfully`, {
      source,
      status: StatusCodes.CREATED,
    });

    return {
      data: {
        data: created as unknown as SupplyTblType,
        message: "Supply created successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.CREATED,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in supply creation`, {
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

export const fetchSuppliesService: ServiceFunctionParamType<
  FetchSuppliesType,
  SupplyTblType[]
> = async (params, { manager_data }) => {
  const source = "FETCH SUPPLIES SERVICE";
  logger.info("Starting fetchSuppliesService", {
    body: params,
  });

  try {
    // Update params with manager's recorded_by if available
    const fetchParams: FetchSuppliesType = {
      ...params,
      recorded_by: manager_data?.user_id || params.recorded_by,
    };

    // Call model layer to fetch supplies
    const modelResponse = await fetchSuppliesModel(fetchParams);

    if (modelResponse.errorMessage || !modelResponse.data) {
      logger.warn(`Failed to fetch supplies`, {
        source,
        errorMessage: modelResponse.errorMessage || "Error fetching supplies",
        status: modelResponse.status,
      });
      throw new CustomError({
        data: null,
        errorMessage: modelResponse.errorMessage || "Error fetching supplies",
        source,
        status: modelResponse.status,
      });
    }

    logger.info(`Fetch supplies completed`, {
      source,
      params: params ?? {},
      found: modelResponse.data.length,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: modelResponse.data,
        pagination: modelResponse.pagination || {
          nextCursor: null,
          hasNextPage: false,
        },
        message: "Supplies fetched successfully",
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

export const fetchSingleSupplyService: ServiceFunctionParamType<
  FetchSingleSupplyType,
  SupplyTblType
> = async (params) => {
  const source = "FETCH SINGLE SUPPLY SERVICE";
  logger.info("Starting fetchSingleSupplyService", {
    body: params,
  });

  try {
    // Call model layer to fetch single supply
    const modelResponse = await fetchSingleSupplyModel(params);

    if (modelResponse.errorMessage || !modelResponse.data) {
      logger.warn(`Failed to fetch supply`, {
        source: `${source} (STAGE 1)`,
        errorMessage: modelResponse.errorMessage || "Supply not found",
        status: modelResponse.status,
      });
      throw new CustomError({
        data: null,
        errorMessage: modelResponse.errorMessage || "Supply not found",
        source: `${source} (STAGE 1)`,
        status: modelResponse.status,
      });
    }

    logger.info(`Supply fetched successfully`, {
      source,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: modelResponse.data,
        message: "Supply fetched successfully",
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

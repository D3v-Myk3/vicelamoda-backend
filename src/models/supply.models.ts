import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger.configs";
import { paginationConfig } from "../configs/pagination.config";
import { CustomError } from "../types/error.types";
import { ModelFunctionParamType } from "../types/general.types";
import {
  FetchSingleSupplyType,
  FetchSuppliesType,
  SupplyTblType,
} from "../types/supply.type";
import { SupplyModel } from "./mongoose/Supply.model";

/* export const createSupplyModel: ModelFunctionParamType<
  CreateSupplyType,
  SupplyTblType
> = async (params) => {
  const source = "CREATE SUPPLY MODEL";
  logger.info(`Creating supply`, { source, params });
  try {
    // Prepare products array with variant support
    const products = await Promise.all(
      params.items.map(async (item) => {
        let variant_sku: string | undefined;
        let variant_name: string | undefined;

        // If variant_sku is provided, validate and get variant info
        if (item.variant_sku) {
          const product = await ProductModel.findOne({
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
        };
      })
    );

    // Create supply with products embedded
    const supplyData: any = {
      supplier_name: params.supplier_name,
      supplier_contact: params.supplier_contact,
      store_id: params.store_id,
      recorded_by: params.recorded_by,
      date_supplied: new Date(params.date_supplied),
      products,
    };

    const supply = await SupplyModel.create(supplyData);

    // Update product stock for each item (handle variants)
    for (const item of params.items) {
      const product = await ProductModel.findOne({
        product_id: item.product_id,
      }).exec();

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

    logger.info(`Create supply completed`, {
      source,
      params: params ?? {},
      status: created,
    });
    return {
      data: created as unknown as SupplyTblType,
      errorMessage: null,
      status: StatusCodes.CREATED,
      source,
    };
  } catch (error) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  }
}; */

export const fetchSuppliesModel: ModelFunctionParamType<
  FetchSuppliesType,
  SupplyTblType[]
> = async (params) => {
  const source = "FETCH SUPPLIES MODEL";
  logger.info(`Fetching supplies`, { source, params });

  // try {
  const limit = Number(params.limit) ?? paginationConfig.defaultLimit;
  const cursor = params.cursor;

  // Build MongoDB query
  const query: any = {};

  if (params.supply_id) query.supply_id = params.supply_id;
  if (params.store_id) query.store_id = params.store_id;
  if (params.recorded_by) query.recorded_by = params.recorded_by;

  if (params.supplier_name) {
    query.supplier_name = { $regex: params.supplier_name, $options: "i" };
  }

  if (params.supplier_contact) {
    query.supplier_contact = {
      $regex: params.supplier_contact,
      $options: "i",
    };
  }

  // General search
  if (params.search) {
    query.$or = [
      { supplier_name: { $regex: params.search, $options: "i" } },
      { supplier_contact: { $regex: params.search, $options: "i" } },
    ];
  }

  // Date range filter
  if (params.start_date || params.end_date) {
    query.createdAt = {};
    if (params.start_date) {
      query.createdAt.$gte = new Date(params.start_date);
    }
    if (params.end_date) {
      query.createdAt.$lte = new Date(params.end_date);
    }
  }

  // Cursor-based pagination
  if (cursor) {
    query.$or = query.$or || [];
    query.$or.push(
      { date_supplied: { $lt: new Date() } },
      { supply_id: { $lt: cursor } }
    );
  }

  // Note: products is an embedded array, so we can't populate it
  // The product_id, variant_sku, and variant_name are already stored in the embedded document
  const result = await SupplyModel.find(query)
    .sort({ date_supplied: -1, supply_id: -1 })
    .limit(limit + 1)
    .lean()
    .exec();

  let nextCursor: string | null = null;
  if (result.length > limit) {
    const nextItem = result.pop();
    nextCursor = nextItem?.supply_id ?? null;
  }

  logger.info(`Fetch supplies completed`, {
    source,
    params: params ?? {},
    found: result.length,
  });
  return {
    data: result as unknown as SupplyTblType[],
    pagination: {
      nextCursor,
      hasNextPage: !!nextCursor,
    },
    errorMessage: null,
    status: StatusCodes.OK,
    source,
  };
  /* } catch (error) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturnObj;
    } else {
      return defaultError(source, String(error));
    }
  } */
};

export const fetchSingleSupplyModel: ModelFunctionParamType<
  FetchSingleSupplyType,
  SupplyTblType
> = async (params) => {
  const source = "FETCH SINGLE SUPPLY MODEL";
  logger.info(`Fetching single supply`, { source, params });

  // try {
  // Note: products is an embedded array, so we can't populate it
  // The product_id, variant_sku, and variant_name are already stored in the embedded document
  const result = await SupplyModel.findOne({
    supply_id: params.supply_id,
  })
    .lean()
    .exec();

  if (!result) {
    throw new CustomError({
      data: null,
      errorMessage: "Supply not found",
      source,
      status: StatusCodes.NOT_FOUND,
    });
  }

  logger.info(`Fetch single supply completed`, {
    source,
    params: params ?? {},
    found: result ? 1 : 0,
  });
  return {
    data: result as unknown as SupplyTblType,
    errorMessage: null,
    status: StatusCodes.OK,
    source,
  };
  /* } catch (error) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  } */
};

import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger.configs";
import { paginationConfig } from "../configs/pagination.config";
import { CustomError } from "../types/error.types";
import { ModelFunctionParamType } from "../types/general.types";
import {
  FetchProductByBarcodeType,
  FetchProductsType,
  FetchSingleProductType,
  ProductTblType,
} from "../types/product.type";
import { ProductModel } from "./mongoose/Product.model";

export const fetchProductsModel: ModelFunctionParamType<
  FetchProductsType,
  ProductTblType[]
> = async (params) => {
  const source = "GET ALL PRODUCTS MODEL";
  logger.info(`Fetching all products`, { source, params });

  // try {
  const limit = Number(params.limit) ?? paginationConfig.defaultLimit;
  const cursor = params.cursor;

  // Build MongoDB query
  const query: any = {};

  // Specific filters
  if (params.product_id) query.product_id = params.product_id;
  if (params.status) query.status = params.status;
  if (params.category_id) query.category_id = params.category_id;
  if (params.brand_id) query.brand_id = params.brand_id;
  if (params.size) query.size = params.size;
  if (params.sku) {
    query.sku = { $regex: params.sku, $options: "i" };
  }
  if (params.name) {
    query.name = { $regex: params.name, $options: "i" };
  }

  // General search across name, sku, and description
  if (params.search) {
    query.$or = [
      { name: { $regex: params.search, $options: "i" } },
      { sku: { $regex: params.search, $options: "i" } },
      { description: { $regex: params.search, $options: "i" } },
    ];
  }

  // Range filters for quantity
  if (params.min_quantity !== undefined || params.max_quantity !== undefined) {
    query.quantity_in_stock = {};
    if (params.min_quantity !== undefined) {
      query.quantity_in_stock.$gte = Number(params.min_quantity);
    }
    if (params.max_quantity !== undefined) {
      query.quantity_in_stock.$lte = Number(params.max_quantity);
    }
  }

  // Range filters for price
  if (params.min_price !== undefined || params.max_price !== undefined) {
    query.selling_price = {};
    if (params.min_price !== undefined) {
      query.selling_price.$gte = Number(params.min_price);
    }
    if (params.max_price !== undefined) {
      query.selling_price.$lte = Number(params.max_price);
    }
  }

  // Cursor-based pagination
  if (cursor) {
    query.$or = query.$or || [];
    query.$or.push(
      { createdAt: { $lt: new Date() } },
      { product_id: { $lt: cursor } }
    );
  }

  console.log(query);

  let queryBuilder = ProductModel.find(query)
    .populate({
      path: "category_id",
      select: "category_id name abbreviation description",
    })
    .populate({
      path: "brand_id",
      select: "brand_id name abbreviation description",
    })
    .sort({ createdAt: -1, product_id: -1 })
    .limit(limit + 1);
  console.log(queryBuilder);

  // Handle constraints (populate relationships)
  /* if (params.constraints?.category) {
    queryBuilder = queryBuilder.populate({
      path: "category_id",
      select: "category_id name abbreviation description",
    });
  }

  if (params.constraints?.brand) {
    queryBuilder = queryBuilder.populate({
      path: "brand_id",
      select: "brand_id name abbreviation description",
    });
  } */

  // Images are always included (embedded in product)
  const result = await queryBuilder.lean().exec();

  let nextCursor: string | null = null;
  if (result.length > limit) {
    const nextItem = result.pop();
    nextCursor = nextItem?.product_id ?? null;
  }

  // Transform result to match ProductTblType structure
  const transformedResult = result.map(
    ({ category_id, brand_id, ...item }) => ({
      ...item,
      category: category_id || null,
      brand: brand_id || null,
      images: item.images || [],
      has_variants: item.has_variants || false,
      variants: item.variants || [],
      variation_options: item.variation_options || [],
    })
  );

  logger.info(`Fetch all products completed`, {
    source,
    params: params ?? {},
    found: transformedResult.length,
    status: StatusCodes.OK,
  });
  return {
    data: transformedResult as unknown as ProductTblType[],
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

export const fetchSingleProductModel: ModelFunctionParamType<
  FetchSingleProductType,
  ProductTblType
> = async (params) => {
  const source = "GET SINGLE PRODUCT MODEL";
  logger.info(`Fetching single product`, { source, params });

  // try {
  let queryBuilder = ProductModel.findOne({
    _id: params.product_id,
  });

  // Handle constraints (populate relationships)
  if (params.constraints?.category) {
    queryBuilder = queryBuilder.populate({
      path: "category_id",
      select: "category_id name abbreviation description",
    });
  }

  if (params.constraints?.brand) {
    queryBuilder = queryBuilder.populate({
      path: "brand_id",
      select: "brand_id name abbreviation description",
    });
  }

  const result = await queryBuilder.lean().exec();

  if (!result) {
    throw new CustomError({
      data: null,
      errorMessage: "Product not found",
      source,
      status: StatusCodes.NOT_FOUND,
    });
  }

  // Transform result to match ProductTblType structure
  const transformedResult = {
    ...result,
    category: result.category_id || null,
    brand: result.brand_id || null,
    images: result.images || [],
    has_variants: result.has_variants || false,
    variants: result.variants || [],
    variation_options: result.variation_options || [],
  };

  logger.info(`Fetch single product completed`, {
    source,
    params: params ?? {},
    found: result ? 1 : 0,
    status: result,
  });
  return {
    data: transformedResult as unknown as ProductTblType,
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

export const fetchProductByBarcodeModel: ModelFunctionParamType<
  FetchProductByBarcodeType,
  ProductTblType
> = async (params) => {
  const source = "GET PRODUCT BY BARCODE MODEL";
  logger.info(`Fetching product by barcode`, { source, params });

  // try {
  let queryBuilder = ProductModel.findOne({
    barcode: params.barcode,
  });

  // Handle constraints (populate relationships)
  if (params.constraints?.category) {
    queryBuilder = queryBuilder.populate({
      path: "category_id",
      select: "category_id name abbreviation description",
    });
  }

  if (params.constraints?.brand) {
    queryBuilder = queryBuilder.populate({
      path: "brand_id",
      select: "brand_id name abbreviation description",
    });
  }

  const result = await queryBuilder.lean().exec();

  if (!result) {
    throw new CustomError({
      data: null,
      errorMessage: "Product not found",
      source,
      status: StatusCodes.NOT_FOUND,
    });
  }

  // Transform result to match ProductTblType structure
  const transformedResult = {
    ...result,
    category: result.category_id || null,
    brand: result.brand_id || null,
    images: result.images || [],
    has_variants: result.has_variants || false,
    variants: result.variants || [],
    variation_options: result.variation_options || [],
  };

  logger.info(`Fetch product by barcode completed`, {
    source,
    params: params ?? {},
    found: result ? 1 : 0,
    status: result,
  });
  return {
    data: transformedResult as unknown as ProductTblType,
    errorMessage: null,
    status: StatusCodes.OK,
    source,
  };
  /*  } catch (error) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  } */
};

/* export const createProductModel: ModelFunctionParamType<
  CreateProductType,
  ProductTblType
> = async (params) => {
  const source = "CREATE PRODUCT MODEL";
  logger.info(`Creating product`, { source, params });
  try {
    const productData: any = {
      name: params.name,
      sku: params.sku,
      size: params.size ?? "STANDARD",
      description: params.description ?? null,
      cost_price: Number(params.cost_price) || 0,
      selling_price: Number(params.selling_price) || 0,
      quantity_in_stock: Number(params.quantity_in_stock) || 0,
      unit: params.unit ?? "pcs",
      category_id: params.category_id ?? null,
      brand_id: params.brand_id ?? null,
      has_variants: params.has_variants ?? false,
      variants: params.variants ?? [],
      variation_options: params.variation_options ?? [],
    };

    // Add images if provided
    if (params.images && Array.isArray(params.images) && params.images.length) {
      productData.images = params.images.map((img: any) => ({
        image_url: img.image_url,
        is_primary: img.is_primary ?? false,
      }));
    }

    const result = await ProductModel.create(productData);

    // Re-fetch created product with populated relationships
    let queryBuilder = ProductModel.findById(result._id);

    //  if (params.constraints?.category) {
    //   queryBuilder = queryBuilder.populate({
    //     path: "category_id",
    //   });
    // }

    // if (params.constraints?.brand) {
    //   queryBuilder = queryBuilder.populate({
    //     path: "brand_id",
    //   });
    // }

    const created = await queryBuilder.lean().exec();

    // Transform result to match ProductTblType structure
    const transformedResult = {
      ...created,
      category: created?.category_id || null,
      brand: created?.brand_id || null,
      images: created?.images || [],
      has_variants: created?.has_variants || false,
      variants: created?.variants || [],
      variation_options: created?.variation_options || [],
    };

    logger.info(`Create product completed`, {
      source,
      params: params ?? {},
      status: created,
    });
    return {
      data: transformedResult as ProductTblType,
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
};
 */

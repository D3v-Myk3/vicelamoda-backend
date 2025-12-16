import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger.configs";
import { paginationConfig } from "../configs/pagination.config";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { BrandModel } from "../models/mongoose/Brand.model";
import {
  BrandTblType,
  CreateBrandType,
  FetchBrandsType,
  UpdateBrandType,
} from "../types/brand.type";
import { CustomError, DefaultErrorReturn } from "../types/error.types";
import { ServiceFunctionParamType } from "../types/general.types";

export const createBrandService: ServiceFunctionParamType<
  CreateBrandType,
  BrandTblType
> = async (params, { admin_data, manager_data }) => {
  const source = "CREATE BRAND SERVICE";
  logger.info("Starting createBrandService", {
    body: params,
  });

  try {
    // Check if brand name or abbreviation already exists
    const existingBrand = await BrandModel.findOne({
      $or: [{ name: params.name }, { abbreviation: params.abbreviation }],
    }).exec();

    if (existingBrand) {
      logger.warn(`Brand with name or abbreviation already exists`, {
        source: `${source} (STAGE 1)`,
        name: params.name,
        abbreviation: params.abbreviation,
        status: StatusCodes.CONFLICT,
      });
      throw new CustomError({
        data: null,
        errorMessage:
          existingBrand.name === params.name
            ? `Brand with name "${params.name}" already exists`
            : `Brand with abbreviation "${params.abbreviation}" already exists`,
        source: `${source} (STAGE 1)`,
        status: StatusCodes.CONFLICT,
      });
    }

    const brand = await BrandModel.create({
      name: params.name,
      abbreviation: params.abbreviation,
      description: params.description ?? undefined,
    });

    if (!brand) {
      logger.warn(`Brand not created`, {
        source: `${source} (STAGE 2)`,
        name: params.name,
        abbreviation: params.abbreviation,
        status: StatusCodes.NOT_IMPLEMENTED,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Brand not created",
        source: `${source} (STAGE 2)`,
        status: StatusCodes.NOT_IMPLEMENTED,
      });
    }

    logger.info(`Brand created successfully`, {
      source,
      status: StatusCodes.CREATED,
    });

    return {
      data: {
        data: brand.toJSON() as unknown as BrandTblType,
        message: "Brand created successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.CREATED,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in brand creation`, {
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

export const updateBrandService: ServiceFunctionParamType<
  UpdateBrandType & {
    brand_id?: string;
  },
  BrandTblType
> = async (params, { admin_data, manager_data }) => {
  const source = "UPDATE BRAND SERVICE";
  logger.info("Starting updateBrandService", {
    body: params,
  });

  try {
    const { brand_id, ...update } = params;

    const brand = await BrandModel.findOneAndUpdate(
      { brand_id: brand_id! },
      { $set: update },
      { new: true }
    )
      .lean()
      .exec();

    if (!brand) {
      logger.info(`No Brand Found to update`, {
        source: `${source} (STAGE 1)`,
        brand_id: params.brand_id,
        errorMessage: "Brand Not Updated",
        status: StatusCodes.NOT_IMPLEMENTED,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Brand Not Found or Not Updated",
        source: `${source} (STAGE 1)`,
        status: StatusCodes.NOT_IMPLEMENTED,
      });
    }

    logger.info(`Brand updated successfully`, {
      source,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: brand as unknown as BrandTblType,
        message: "Brand updated successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in brand update`, {
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

export const fetchBrandsService: ServiceFunctionParamType<
  FetchBrandsType,
  BrandTblType[]
> = async (params, { admin_data, manager_data }) => {
  const source = "FETCH BRANDS SERVICE";
  logger.info("Starting fetchBrandsService", {
    body: params,
  });

  try {
    const limit = Number(params.limit) ?? paginationConfig.defaultLimit;
    const cursor = params.cursor;

    // Build dynamic query
    const query: any = {};

    // Specific filters
    if (params.brand_id) query.brand_id = params.brand_id;
    if (params.name) {
      query.name = { $regex: params.name, $options: "i" };
    }
    if (params.abbreviation) {
      query.abbreviation = { $regex: params.abbreviation, $options: "i" };
    }

    // General search
    if (params.search) {
      const searchRegex = { $regex: params.search, $options: "i" };
      query.$or = [
        { name: searchRegex },
        { abbreviation: searchRegex },
        { description: searchRegex },
      ];
    }

    // Cursor-based pagination logic (simplified)
    if (cursor) {
      query.brand_id = { $gt: cursor };
    }

    const brands = await BrandModel.find(query)
      .sort({ brand_id: 1 })
      .limit(limit + 1)
      .populate("products")
      .lean()
      .exec();

    if (!brands || (brands.length === 0 && !cursor)) {
      if (!cursor) {
        logger.info(`No Brands Found`, {
          source: `${source} (STAGE 1)`,
          brand_id: params.brand_id,
          errorMessage: "No Brands Found",
          status: StatusCodes.NOT_IMPLEMENTED,
        });
        throw new CustomError({
          data: null,
          errorMessage: "No Brands Found",
          source: `${source} (STAGE 1)`,
          status: StatusCodes.NOT_IMPLEMENTED,
        });
      }
    }

    let nextCursor: string | null = null;
    let dataToReturn = brands as unknown as BrandTblType[];

    if (brands.length > limit) {
      const nextItem = dataToReturn.pop();
      nextCursor = nextItem?.brand_id ?? null;
    }

    logger.info(`Brands fetched successfully`, {
      source,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: dataToReturn,
        pagination: {
          nextCursor,
          hasNextPage: !!nextCursor,
        },
        message: "Brands fetched successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in brand fetch`, {
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

export const fetchSingleBrandService: ServiceFunctionParamType<
  { brand_id: string },
  BrandTblType
> = async ({ brand_id }, { admin_data, manager_data }) => {
  const source = "FETCH SINGLE BRAND SERVICE";
  logger.info("Starting fetchSingleBrandService", {
    body: { brand_id },
  });

  try {
    const brand = await BrandModel.findOne({ brand_id })
      .populate("products")
      .lean()
      .exec();

    if (!brand) {
      logger.info(`No Brand Found to fetch`, {
        source: `${source} (STAGE 1)`,
        brand_id,
        errorMessage: "Brand Not Found",
        status: StatusCodes.NOT_IMPLEMENTED,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Brand Not Found",
        source: `${source} (STAGE 1)`,
        status: StatusCodes.NOT_IMPLEMENTED,
      });
    }

    logger.info(`Brand fetched successfully`, {
      source,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: brand as unknown as BrandTblType,
        message: "Brand fetched successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in brand fetch`, {
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

export const deleteBrandService: ServiceFunctionParamType<
  { brand_id: string },
  BrandTblType
> = async (params, { admin_data, manager_data }) => {
  const source = "DELETE BRAND SERVICE";
  logger.info("Starting deleteBrandService", {
    body: params,
  });

  try {
    const brand = await BrandModel.findOneAndDelete({
      brand_id: params.brand_id,
    })
      .lean()
      .exec();

    if (!brand) {
      logger.info(`No Brand Found to delete`, {
        source: `${source} (STAGE 1)`,
        brand_id: params.brand_id,
        errorMessage: "Brand Not Deleted",
        status: StatusCodes.NOT_IMPLEMENTED,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Brand Not Found or Not Deleted",
        source: `${source} (STAGE 1)`,
        status: StatusCodes.NOT_IMPLEMENTED,
      });
    }

    logger.info(`Brand deleted successfully`, {
      source,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: brand as unknown as BrandTblType,
        message: "Brand deleted successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in brand delete`, {
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

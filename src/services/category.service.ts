import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger.configs";
import { paginationConfig } from "../configs/pagination.config";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { CategoryModel } from "../models/mongoose/Category.model";
import {
  CategoryTblType,
  CreateCategoryType,
  FetchCategoriesType,
  UpdateCategoryType,
} from "../types/category.type";
import { CustomError, DefaultErrorReturn } from "../types/error.types";
import { ServiceFunctionParamType } from "../types/general.types";

export const createCategoryService: ServiceFunctionParamType<
  CreateCategoryType,
  CategoryTblType
> = async (params, { admin_data, manager_data }) => {
  const source = "CREATE CATEGORY SERVICE";
  logger.info("Starting createCategoryService", {
    body: params,
  });

  try {
    // Check if category name or abbreviation already exists
    const existingCategory = await CategoryModel.findOne({
      $or: [{ name: params.name }, { abbreviation: params.abbreviation }],
    }).exec();

    if (existingCategory) {
      logger.warn(`Category with name or abbreviation already exists`, {
        source: `${source} (STAGE 1)`,
        name: params.name,
        abbreviation: params.abbreviation,
        status: StatusCodes.CONFLICT,
      });
      throw new CustomError({
        data: null,
        errorMessage:
          existingCategory.name === params.name
            ? `Category with name "${params.name}" already exists`
            : `Category with abbreviation "${params.abbreviation}" already exists`,
        source: `${source} (STAGE 1)`,
        status: StatusCodes.CONFLICT,
      });
    }

    const category = await CategoryModel.create({
      name: params.name,
      abbreviation: params.abbreviation,
      description: params.description ?? undefined,
    });

    if (!category) {
      logger.warn(`Category not created`, {
        source: `${source} (STAGE 2)`,
        name: params.name,
        abbreviation: params.abbreviation,
        status: StatusCodes.NOT_IMPLEMENTED,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Category not created",
        source: `${source} (STAGE 2)`,
        status: StatusCodes.NOT_IMPLEMENTED,
      });
    }

    logger.info(`Category created successfully`, {
      source,
      status: StatusCodes.CREATED,
    });

    return {
      data: {
        data: category.toJSON() as unknown as CategoryTblType,
        message: "Category created successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.CREATED,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in category creation`, {
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

export const updateCategoryService: ServiceFunctionParamType<
  UpdateCategoryType & {
    category_id?: string;
  },
  CategoryTblType
> = async (params, { admin_data, manager_data }) => {
  const source = "UPDATE CATEGORY SERVICE";
  logger.info("Starting updateCategoryService", {
    body: params,
  });

  try {
    const { category_id, ...update } = params;

    const category = await CategoryModel.findOneAndUpdate(
      { category_id: category_id! },
      { $set: update },
      { new: true }
    )
      .lean()
      .exec();

    if (!category) {
      logger.info(`No Category Found to update`, {
        source: `${source} (STAGE 1)`,
        category_id: params.category_id,
        errorMessage: "Category Not Updated",
        status: StatusCodes.NOT_IMPLEMENTED,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Category Not Found or Not Updated",
        source: `${source} (STAGE 1)`,
        status: StatusCodes.NOT_IMPLEMENTED,
      });
    }

    logger.info(`Category updated successfully`, {
      source,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: category as unknown as CategoryTblType,
        message: "Category updated successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in category update`, {
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

export const fetchCategoriesService: ServiceFunctionParamType<
  FetchCategoriesType,
  CategoryTblType[]
> = async (params, { admin_data, manager_data }) => {
  const source = "FETCH CATEGORIES SERVICE";
  logger.info("Starting fetchCategoriesService", {
    body: params,
  });

  try {
    const limit = Number(params.limit) ?? paginationConfig.defaultLimit;
    const cursor = params.cursor; // cursor logic might need adjustment for Mongoose if it relied on int ID or something orderable

    // Build dynamic query
    const query: any = {};

    // Specific filters
    if (params.category_id) query.category_id = params.category_id;
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

    // Cursor-based pagination logic (simplified for string IDs)
    if (cursor) {
      query.category_id = { $gt: cursor };
    }

    const categories = await CategoryModel.find(query)
      .sort({ category_id: 1 }) // Ensure deterministic sort for cursor pagination
      .limit(limit + 1)
      .populate("products") // Populate virtual 'products'
      .lean()
      .exec();

    if (!categories || (categories.length === 0 && !cursor)) {
      // Allow empty page if checking next page or something, but preserve original logic mostly
      // If genuinely no categories found at all (and no cursor), might throw error as before
      // But commonly list endpoints return empty array. Sticking to previous behavior:
      if (!cursor) {
        logger.info(`No Categories Found`, {
          source: `${source} (STAGE 1)`,
          category_id: params.category_id,
          errorMessage: "No Categories Found",
          status: StatusCodes.NOT_IMPLEMENTED,
        });
        throw new CustomError({
          data: null,
          errorMessage: "No Categories Found",
          source: `${source} (STAGE 1)`,
          status: StatusCodes.NOT_IMPLEMENTED,
        });
      }
    }

    let nextCursor: string | null = null;
    let dataToReturn = categories as unknown as CategoryTblType[];

    if (categories.length > limit) {
      const nextItem = dataToReturn.pop();
      nextCursor = nextItem?.category_id ?? null;
    }

    logger.info(`Categories fetched successfully`, {
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
        message: "Categories fetched successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in category fetch`, {
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

export const fetchSingleCategoryService: ServiceFunctionParamType<
  { category_id: string; constraints?: any },
  CategoryTblType
> = async ({ category_id }, { admin_data, manager_data }) => {
  const source = "FETCH SINGLE CATEGORY SERVICE";
  logger.info("Starting fetchSingleCategoryService", {
    body: { category_id },
  });

  try {
    const category = await CategoryModel.findOne({ category_id })
      .populate("products")
      .lean()
      .exec();

    if (!category) {
      logger.info(`No Category Found to fetch`, {
        source: `${source} (STAGE 1)`,
        category_id,
        errorMessage: "Category Not Found",
        status: StatusCodes.NOT_IMPLEMENTED,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Category Not Found",
        source: `${source} (STAGE 1)`,
        status: StatusCodes.NOT_IMPLEMENTED,
      });
    }

    logger.info(`Category fetched successfully`, {
      source,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: category as unknown as CategoryTblType,
        message: "Category fetched successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in category fetch`, {
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

export const deleteCategoryService: ServiceFunctionParamType<
  { category_id: string },
  CategoryTblType
> = async (params, { admin_data, manager_data }) => {
  const source = "DELETE CATEGORY SERVICE";
  logger.info("Starting deleteCategoryService", {
    body: params,
  });

  try {
    const category = await CategoryModel.findOneAndDelete({
      category_id: params.category_id,
    })
      .lean()
      .exec();

    if (!category) {
      logger.info(`No Category Found to delete`, {
        source: `${source} (STAGE 1)`,
        category_id: params.category_id,
        errorMessage: "Category Not Deleted",
        status: StatusCodes.NOT_IMPLEMENTED,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Category Not Found or Not Deleted",
        source: `${source} (STAGE 1)`,
        status: StatusCodes.NOT_IMPLEMENTED,
      });
    }

    logger.info(`Category deleted successfully`, {
      source,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: category as unknown as CategoryTblType,
        message: "Category deleted successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in category delete`, {
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

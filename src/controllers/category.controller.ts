import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import {
  createCategoryService,
  deleteCategoryService,
  fetchCategoriesService,
  fetchSingleCategoryService,
  updateCategoryService,
} from "../services/category.service";
import {
  CategoryTblType,
  CreateCategoryType,
  FetchCategoriesType,
  FetchSingleCategoryType,
  UpdateCategoryType,
} from "../types/category.type";
import {
  CustomRequest,
  CustomResponse,
  JSONResponseType,
} from "../types/general.types";

export const createCategoryController = async (
  req: CustomRequest<unknown, unknown, CreateCategoryType, unknown>,
  res: CustomResponse<CategoryTblType | null>
): Promise<void> => {
  const source = "CREATE CATEGORY CONTROLLER";
  try {
    logger.info("Starting createCategoryController", {
      body: req.body,
      path: req.originalUrl,
      ip: req.ip,
    });
    const { body } = req;
    const { admin_data, manager_data } = res.locals;

    const response = await createCategoryService(body, {
      admin_data,
      manager_data,
    });

    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Create category failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response.data as JSONResponseType<CategoryTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in createCategoryController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in createCategoryController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const updateCategoryController = async (
  req: CustomRequest<
    { category_id: string },
    unknown,
    UpdateCategoryType,
    unknown
  >,
  res: CustomResponse<CategoryTblType | null>
): Promise<void> => {
  const source = "UPDATE CATEGORY CONTROLLER";
  try {
    logger.info("Starting updateCategoryController", {
      params: req.params,
      body: req.body,
      path: req.originalUrl,
      ip: req.ip,
    });
    const category_id = req.params.category_id;
    const body = req.body as UpdateCategoryType;
    const { admin_data, manager_data } = res.locals;

    const response = await updateCategoryService(
      { category_id, ...body },
      { admin_data, manager_data }
    );

    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Update category failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response.data as JSONResponseType<CategoryTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in updateCategoryController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in updateCategoryController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const fetchCategoriesController = async (
  req: CustomRequest<unknown, unknown, unknown, FetchCategoriesType>,
  res: CustomResponse<CategoryTblType[] | null>
): Promise<void> => {
  const source = "FETCH CATEGORIES CONTROLLER";
  try {
    logger.info("Starting fetchCategoriesController", {
      query: req.query,
      path: req.originalUrl,
      ip: req.ip,
    });
    const params = req.query as FetchCategoriesType;
    const { admin_data, manager_data } = res.locals;

    const response = await fetchCategoriesService(params, {
      admin_data,
      manager_data,
    });

    if (
      (response?.data === null || response?.errorMessage) &&
      response?.status &&
      response?.status >= 300
    ) {
      logger.warn("Fetch categories failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response?.data as JSONResponseType<CategoryTblType[]>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in fetchCategoriesController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in fetchCategoriesController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const fetchSingleCategoryController = async (
  req: CustomRequest<{ category_id: string }, unknown, unknown, unknown>,
  res: CustomResponse<CategoryTblType | null>
): Promise<void> => {
  const source = "FETCH SINGLE CATEGORY CONTROLLER";
  try {
    logger.info("Starting fetchSingleCategoryController", {
      params: req.params,
      path: req.originalUrl,
      ip: req.ip,
    });
    const category_id = req.params.category_id;
    const constraints = req.query as FetchSingleCategoryType["constraints"];
    const { admin_data, manager_data } = res.locals;

    const response = await fetchSingleCategoryService(
      { category_id, constraints },
      { admin_data, manager_data }
    );
    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Fetch category failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response?.data as JSONResponseType<CategoryTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in fetchSingleCategoryController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in fetchSingleCategoryController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const deleteCategoryController = async (
  req: CustomRequest<{ category_id: string }, unknown, unknown, unknown>,
  res: CustomResponse<CategoryTblType | null>
): Promise<void> => {
  const source = "DELETE CATEGORY CONTROLLER";
  try {
    logger.info("Starting deleteCategoryController", {
      params: req.params,
      path: req.originalUrl,
      ip: req.ip,
    });
    const category_id = req.params.category_id;
    const { admin_data, manager_data } = res.locals;

    const response = await deleteCategoryService(
      { category_id },
      { admin_data, manager_data }
    );

    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Delete category failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response.data as JSONResponseType<CategoryTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in deleteCategoryController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in deleteCategoryController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

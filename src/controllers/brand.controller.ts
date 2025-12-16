import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import {
  createBrandService,
  deleteBrandService,
  fetchBrandsService,
  fetchSingleBrandService,
  updateBrandService,
} from "../services/brand.service";
import {
  BrandTblType,
  CreateBrandType,
  FetchBrandsType,
  UpdateBrandType,
} from "../types/brand.type";
import {
  CustomRequest,
  CustomResponse,
  JSONResponseType,
} from "../types/general.types";

export const createBrandController = async (
  req: CustomRequest<unknown, unknown, CreateBrandType, unknown>,
  res: CustomResponse<BrandTblType | null>
): Promise<void> => {
  const source = "CREATE BRAND CONTROLLER";
  try {
    logger.info("Starting createBrandController", {
      body: req.body,
      path: req.originalUrl,
      ip: req.ip,
    });
    const { body } = req;
    const { admin_data, manager_data } = res.locals;

    const response = await createBrandService(body, {
      admin_data,
      manager_data,
    });

    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Create brand failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response.data as JSONResponseType<BrandTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in createBrandController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in createBrandController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const updateBrandController = async (
  req: CustomRequest<{ brand_id: string }, unknown, UpdateBrandType, unknown>,
  res: CustomResponse<BrandTblType | null>
): Promise<void> => {
  const source = "UPDATE BRAND CONTROLLER";
  try {
    logger.info("Starting updateBrandController", {
      params: req.params,
      body: req.body,
      path: req.originalUrl,
      ip: req.ip,
    });
    const brand_id = req.params.brand_id;
    const body = req.body as UpdateBrandType;
    const { admin_data, manager_data } = res.locals;

    const response = await updateBrandService(
      { brand_id, ...body },
      { admin_data, manager_data }
    );

    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Update brand failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response.data as JSONResponseType<BrandTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in updateBrandController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in updateBrandController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const fetchBrandsController = async (
  req: CustomRequest<unknown, unknown, unknown, FetchBrandsType>,
  res: CustomResponse<BrandTblType[] | null>
): Promise<void> => {
  const source = "FETCH BRANDS CONTROLLER";
  try {
    logger.info("Starting fetchBrandsController", {
      query: req.query,
      path: req.originalUrl,
      ip: req.ip,
    });
    const params = req.query as FetchBrandsType;
    const { admin_data, manager_data } = res.locals;

    const response = await fetchBrandsService(params, {
      admin_data,
      manager_data,
    });

    if (
      (response?.data === null || response?.errorMessage) &&
      response?.status &&
      response?.status >= 300
    ) {
      logger.warn("Fetch brands failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response?.data as JSONResponseType<BrandTblType[]>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in fetchBrandsController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in fetchBrandsController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const fetchSingleBrandController = async (
  req: CustomRequest<{ brand_id: string }, unknown, unknown, unknown>,
  res: CustomResponse<BrandTblType | null>
): Promise<void> => {
  const source = "FETCH SINGLE BRAND CONTROLLER";
  try {
    logger.info("Starting fetchSingleBrandController", {
      params: req.params,
      path: req.originalUrl,
      ip: req.ip,
    });
    const brand_id = req.params.brand_id;
    const { admin_data, manager_data } = res.locals;

    const response = await fetchSingleBrandService(
      { brand_id },
      { admin_data, manager_data }
    );
    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Fetch brand failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response?.data as JSONResponseType<BrandTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in fetchSingleBrandController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in fetchSingleBrandController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const deleteBrandController = async (
  req: CustomRequest<{ brand_id: string }, unknown, unknown, unknown>,
  res: CustomResponse<BrandTblType | null>
): Promise<void> => {
  const source = "DELETE BRAND CONTROLLER";
  try {
    logger.info("Starting deleteBrandController", {
      params: req.params,
      path: req.originalUrl,
      ip: req.ip,
    });
    const brand_id = req.params.brand_id;
    const { admin_data, manager_data } = res.locals;

    const response = await deleteBrandService(
      { brand_id },
      { admin_data, manager_data }
    );

    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Delete brand failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response.data as JSONResponseType<BrandTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in deleteBrandController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in deleteBrandController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { CreateStoreFormType } from "../schemas/store.zod.schemas";
import {
  createStoreService,
  deleteStoreService,
  fetchSingleStoreService,
  fetchStoresService,
  updateStoreService,
} from "../services/store.service";
import {
  CustomRequest,
  CustomResponse,
  JSONResponseType,
} from "../types/general.types";
import {
  FetchSingleStoreType,
  FetchStoresType,
  StoreTblType,
  UpdateStoreType,
} from "../types/store.types";

export const createStoreController = async (
  req: CustomRequest<unknown, unknown, CreateStoreFormType, unknown>,
  res: CustomResponse<StoreTblType | null>
) => {
  const source = "CREATE STORE CONTROLLER";
  logger.info(`Starting createStoreController`, { source });
  try {
    const { body } = req;
    const { admin_data, manager_data } = res.locals;

    const response = await createStoreService(body, {
      admin_data,
      manager_data,
    });

    if (
      (response?.data === null || response?.errorMessage) &&
      response?.status &&
      response?.status >= 300
    ) {
      logger.warn(`Failed to create store`, {
        source,
        errorMessage: response.errorMessage,
        status: response.status,
      });
      handleErrors({ response, res });
      return;
    }

    logger.info(`Store created successfully`, {
      source,
      status: response.status,
    });
    const resData = response.data as JSONResponseType<StoreTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in createStoreController", {
        error: error.message,
        stack: error.stack,
      });
      // Cast res to any to avoid strict type mismatch with handleErrors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleErrors({ res: res as any, error, source });
    } else {
      logger.error("Unexpected error in createStoreController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const fetchStoresController = async (
  req: CustomRequest<unknown, unknown, unknown, FetchStoresType>,
  res: CustomResponse<StoreTblType[] | null>
) => {
  const source = "FETCH STORES CONTROLLER";
  logger.info(`Starting fetchStoresController`, { source });
  try {
    const params = req.query as FetchStoresType;
    const { admin_data, manager_data } = res.locals;

    const response = await fetchStoresService(params, {
      admin_data,
      manager_data,
    });

    if (
      (response?.data === null || response?.errorMessage) &&
      response?.status &&
      response?.status >= 300
    ) {
      logger.warn(`Failed to fetch stores`, {
        source,
        errorMessage: response.errorMessage,
        status: response.status,
      });
      // Cast res to any to avoid strict type mismatch with handleErrors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleErrors({ response, res: res as any });
      return;
    }

    logger.info(`Stores fetched successfully`, {
      source,
      status: response.status,
    });

    const resData = response.data as JSONResponseType<StoreTblType[]>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in fetchStoresController", {
        error: error.message,
        stack: error.stack,
      });
      // Cast res to any to avoid strict type mismatch with handleErrors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleErrors({ res: res as any, error, source });
    } else {
      logger.error("Unexpected error in fetchStoresController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const fetchSingleStoreController = async (
  req: CustomRequest<FetchSingleStoreType, unknown, unknown, unknown>,
  res: CustomResponse<StoreTblType | null>
) => {
  const source = "FETCH SINGLE STORE CONTROLLER";
  logger.info(`Starting fetchSingleStoreController`, { source });
  try {
    const { store_id } = req.params;
    const { admin_data, manager_data } = res.locals;

    const response = await fetchSingleStoreService(
      { store_id },
      { admin_data, manager_data }
    );

    if (
      (response?.data === null || response?.errorMessage) &&
      response?.status &&
      response?.status >= 300
    ) {
      logger.warn(`Failed to fetch store`, {
        source,
        errorMessage: response.errorMessage,
        status: response.status,
      });
      // Cast res to any to avoid strict type mismatch with handleErrors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleErrors({ response, res: res as any });
      return;
    }

    logger.info(`Store fetched successfully`, {
      source,
      status: response.status,
    });

    const resData = response.data as JSONResponseType<StoreTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in fetchSingleStoreController", {
        error: error.message,
        stack: error.stack,
      });
      // Cast res to any to avoid strict type mismatch with handleErrors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleErrors({ res: res as any, error, source });
    } else {
      logger.error("Unexpected error in fetchSingleStoreController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const updateStoreController = async (
  req: CustomRequest<{ store_id: string }, unknown, UpdateStoreType, unknown>,
  res: CustomResponse<StoreTblType | null>
) => {
  const source = "UPDATE STORE CONTROLLER";
  logger.info(`Starting updateStoreController`, { source });
  try {
    const { store_id } = req.params;
    const { body } = req;
    const { admin_data, manager_data } = res.locals;

    const response = await updateStoreService(
      { store_id, ...body },
      { admin_data, manager_data }
    );

    if (
      (response?.data === null || response?.errorMessage) &&
      response?.status &&
      response?.status >= 300
    ) {
      logger.warn(`Failed to update store`, {
        source,
        errorMessage: response.errorMessage,
        status: response.status,
      });
      // Cast res to any to avoid strict type mismatch with handleErrors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleErrors({ response, res: res as any });
      return;
    }

    logger.info(`Store updated successfully`, {
      source,
      status: response.status,
    });

    const resData = response.data as JSONResponseType<StoreTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in updateStoreController", {
        error: error.message,
        stack: error.stack,
      });
      // Cast res to any to avoid strict type mismatch with handleErrors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleErrors({ res: res as any, error, source });
    } else {
      logger.error("Unexpected error in updateStoreController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const deleteStoreController = async (
  req: CustomRequest<{ store_id: string }, unknown, unknown, unknown>,
  res: CustomResponse<StoreTblType | null>
) => {
  const source = "DELETE STORE CONTROLLER";
  logger.info(`Starting deleteStoreController`, { source });
  try {
    const { store_id } = req.params;
    const { admin_data, manager_data } = res.locals;

    const response = await deleteStoreService(
      { store_id },
      { admin_data, manager_data }
    );

    if (
      (response?.data === null || response?.errorMessage) &&
      response?.status &&
      response?.status >= 300
    ) {
      logger.warn(`Failed to delete store`, {
        source,
        errorMessage: response.errorMessage,
        status: response.status,
      });
      // Cast res to any to avoid strict type mismatch with handleErrors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleErrors({ response, res: res as any });
      return;
    }

    logger.info(`Store deleted successfully`, {
      source,
      status: response.status,
    });

    const resData = response.data as JSONResponseType<StoreTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in deleteStoreController", {
        error: error.message,
        stack: error.stack,
      });
      // Cast res to any to avoid strict type mismatch with handleErrors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleErrors({ res: res as any, error, source });
    } else {
      logger.error("Unexpected error in deleteStoreController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

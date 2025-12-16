import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { StoreModel } from "../models/mongoose/Store.model";
import { CreateStoreFormType } from "../schemas/store.zod.schemas";
import { CustomError, DefaultErrorReturn } from "../types/error.types";
import { ServiceFunctionParamType } from "../types/general.types";
import {
  FetchSingleStoreType,
  FetchStoresType,
  StoreTblType,
  UpdateStoreType,
} from "../types/store.types";

export const createStoreService: ServiceFunctionParamType<
  CreateStoreFormType,
  StoreTblType
> = async (params, { admin_data, manager_data }) => {
  const source = "CREATE STORE SERVICE";
  logger.info("Starting createStoreService", {
    body: params,
  });

  try {
    // Check if store name or code already exists
    const existingStore = await StoreModel.findOne({
      $or: [{ name: params.name }, { code: params.code }],
    }).exec();

    if (existingStore) {
      logger.warn(`Store with name or code already exists`, {
        source: `${source} (STAGE 1)`,
        name: params.name,
        code: params.code,
        status: StatusCodes.CONFLICT,
      });
      throw new CustomError({
        data: null,
        errorMessage:
          existingStore.name === params.name
            ? `Store with name "${params.name}" already exists`
            : `Store with code "${params.code}" already exists`,
        source: `${source} (STAGE 1)`,
        status: StatusCodes.CONFLICT,
      });
    }

    const store = await StoreModel.create({
      name: params.name,
      code: params.code,
      address: params.address,
      phone: params.phone,
      manager_id: params.manager_id,
    });

    if (!store) {
      logger.warn(`Store not created`, {
        source: `${source} (STAGE 2)`,
        name: params.name,
        status: StatusCodes.NOT_IMPLEMENTED,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Store not created",
        source: `${source} (STAGE 2)`,
        status: StatusCodes.NOT_IMPLEMENTED,
      });
    }

    logger.info(`Store created successfully`, {
      source,
      status: StatusCodes.CREATED,
    });

    return {
      data: {
        data: store.toJSON() as unknown as StoreTblType,
        message: "Store created successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.CREATED,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in store creation`, {
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

export const fetchStoresService: ServiceFunctionParamType<
  FetchStoresType,
  StoreTblType[]
> = async (params, { admin_data, manager_data }) => {
  const source = "FETCH STORES SERVICE";
  logger.info("Starting fetchStoresService", {
    body: params,
  });

  try {
    const query: any = {};
    if (params.store_id) query.store_id = params.store_id;
    if (params.name) query.name = { $regex: params.name, $options: "i" };
    if (params.code) query.code = params.code;
    if (params.manager_id) query.manager_id = params.manager_id;

    const stores = await StoreModel.find(query)
      .sort({ createdAt: -1 })
      .populate("manager")
      .lean()
      .exec();

    if (!stores || stores.length === 0) {
      logger.info(`No Stores Found`, {
        source: `${source} (STAGE 1)`,
        store_id: params.store_id,
        errorMessage: "No Stores Found",
        status: StatusCodes.NOT_FOUND,
      });
      // Depending on requirement, either return empty list or throw error.
      // Keeping consistent with previous implementation to throw error if "Not Found" logic was strict,
      // but usually fetch returns empty array. The previous one threw error, so I'll keep it.
      throw new CustomError({
        data: null,
        errorMessage: "No Stores Found",
        source: `${source} (STAGE 1)`,
        status: StatusCodes.NOT_FOUND,
      });
    }

    logger.info(`Stores fetched successfully`, {
      source,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: stores as unknown as StoreTblType[],
        message: "Stores fetched successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in store fetch`, {
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

export const fetchSingleStoreService: ServiceFunctionParamType<
  FetchSingleStoreType,
  StoreTblType
> = async (params, { admin_data, manager_data }) => {
  const source = "FETCH SINGLE STORE SERVICE";
  logger.info("Starting fetchSingleStoreService", {
    body: params,
  });

  try {
    const store = await StoreModel.findOne({ store_id: params.store_id })
      .populate("manager")
      .lean()
      .exec();

    if (!store) {
      logger.info(`No Store Found to fetch`, {
        source: `${source} (STAGE 1)`,
        store_id: params.store_id,
        errorMessage: "Store Not Found",
        status: StatusCodes.NOT_FOUND,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Store Not Found",
        source: `${source} (STAGE 1)`,
        status: StatusCodes.NOT_FOUND,
      });
    }

    logger.info(`Store fetched successfully`, {
      source,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: store as unknown as StoreTblType,
        message: "Store fetched successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in store fetch`, {
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

export const updateStoreService: ServiceFunctionParamType<
  UpdateStoreType & { store_id: string },
  StoreTblType
> = async (params, { admin_data, manager_data }) => {
  const source = "UPDATE STORE SERVICE";
  logger.info("Starting updateStoreService", {
    body: params,
  });

  try {
    const { store_id, ...data } = params;

    const store = await StoreModel.findOneAndUpdate(
      { store_id },
      { $set: data },
      { new: true }
    )
      .populate("manager")
      .lean()
      .exec();

    if (!store) {
      logger.info(`No Store Found to update`, {
        source: `${source} (STAGE 1)`,
        store_id: params.store_id,
        errorMessage: "Store Not Updated",
        status: StatusCodes.NOT_IMPLEMENTED,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Store Not Found or Not Updated",
        source: `${source} (STAGE 1)`,
        status: StatusCodes.NOT_IMPLEMENTED,
      });
    }

    logger.info(`Store updated successfully`, {
      source,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: store as unknown as StoreTblType,
        message: "Store updated successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in store update`, {
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

export const deleteStoreService: ServiceFunctionParamType<
  { store_id: string },
  StoreTblType
> = async (params, { admin_data, manager_data }) => {
  const source = "DELETE STORE SERVICE";
  logger.info("Starting deleteStoreService", {
    body: params,
  });

  try {
    const store = await StoreModel.findOneAndDelete({
      store_id: params.store_id,
    })
      .lean()
      .exec();

    if (!store) {
      logger.info(`No Store Found to delete`, {
        source: `${source} (STAGE 1)`,
        store_id: params.store_id,
        errorMessage: "Store Not Deleted",
        status: StatusCodes.NOT_IMPLEMENTED,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Store Not Found or Not Deleted",
        source: `${source} (STAGE 1)`,
        status: StatusCodes.NOT_IMPLEMENTED,
      });
    }

    logger.info(`Store deleted successfully`, {
      source,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: store as unknown as StoreTblType,
        message: "Store deleted successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in store delete`, {
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

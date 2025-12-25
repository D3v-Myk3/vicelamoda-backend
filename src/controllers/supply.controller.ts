import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import {
  CreateSupplyFormType,
  UpdateSupplyFormType,
} from "../schemas/supply.zod.schemas";
import {
  createSupplyService,
  deleteSupplyService,
  fetchSingleSupplyService,
  fetchSuppliesService,
  updateSupplyService,
} from "../services/supply.service";
import {
  CustomRequest,
  CustomResponse,
  JSONResponseType,
} from "../types/general.types";
import {
  FetchSingleSupplyType,
  FetchSuppliesType,
  SupplyTblType,
} from "../types/supply.type";

export const createSupplyController = async (
  req: CustomRequest<unknown, unknown, CreateSupplyFormType, unknown>,
  res: CustomResponse
) => {
  const source = "CREATE SUPPLY CONTROLLER";
  logger.info(`Starting createSupplyController`, { source });
  try {
    const { admin_data, manager_data } = res.locals;

    // Ensure default store_id if not present - mirroring previous manual logic but ideally should be in service logic if hardcoded
    const body = {
      ...req.body,
      store_id: req.body.store_id || "cln2g31d4000008jz072lb09k",
    };

    const response = await createSupplyService(body, {
      admin_data,
      manager_data,
    });

    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Create supply failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response.data as JSONResponseType;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in createSupplyController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in createSupplyController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const fetchSuppliesController = async (
  req: CustomRequest<unknown, unknown, unknown, FetchSuppliesType>,
  res: CustomResponse<SupplyTblType[] | null>
) => {
  const source = "FETCH SUPPLIES CONTROLLER";
  logger.info(`Starting fetchSuppliesController`, { source });
  try {
    const params = req.query as FetchSuppliesType;
    const { admin_data, manager_data } = res.locals;

    // Convert date strings to Date objects effectively handled by service type casting if needed or passed as string
    // Type definition for FetchSuppliesType likely anticipates proper types, but query params are strings.
    // The service layer handles this by using Prisma which accepts Date or ISO strings usually,
    // but explicit conversion in controller before service is safer if types mismatch.
    // However, for now passing as is since service logic handles `new Date()` logic in service if needed?
    // Looking at service implementation: `start_date` and `end_date` are expected in `FetchSuppliesType`

    const response = await fetchSuppliesService(params, {
      admin_data,
      manager_data,
    });

    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Fetch supplies failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response.data as JSONResponseType<SupplyTblType[]>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in fetchSuppliesController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in fetchSuppliesController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const fetchSingleSupplyController = async (
  req: CustomRequest<
    FetchSingleSupplyType,
    unknown,
    unknown,
    FetchSingleSupplyType
  >,
  res: CustomResponse<SupplyTblType | null>
) => {
  const source = "FETCH SINGLE SUPPLY CONTROLLER";
  logger.info(`Starting fetchSingleSupplyController`, { source });
  try {
    const { supply_id } = req.params;
    const { admin_data, manager_data } = res.locals;

    // supply_id check moved to service/redundant as Zod/Types catch it or service handles missing id -> not found

    const response = await fetchSingleSupplyService(
      {
        supply_id,
        constraints: {
          products: true,
          stockMovements: true,
        },
      },
      { admin_data, manager_data }
    );

    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Fetch supply failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response.data as JSONResponseType<SupplyTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in fetchSingleSupplyController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in fetchSingleSupplyController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const updateSupplyController = async (
  req: CustomRequest<{ supply_id: string }, unknown, UpdateSupplyFormType>,
  res: CustomResponse<SupplyTblType>
): Promise<void> => {
  const source = "UPDATE SUPPLY CONTROLLER";
  try {
    logger.info("Starting updateSupplyController", {
      params: req.params,
      body: req.body,
    });
    const { supply_id } = req.params;
    const update_data = req.body;
    const { admin_data, manager_data } = res.locals;

    const response = await updateSupplyService(
      { supply_id, update_data },
      { admin_data, manager_data }
    );

    if (response.errorMessage || response.status >= 300) {
      handleErrors({ response: response as any, res: res as any });
      return;
    }

    const resData = response.data as JSONResponseType<SupplyTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    handleErrors({ res: res as any, error: error as any, source });
  }
};

export const deleteSupplyController = async (
  req: CustomRequest<{ supply_id: string }, unknown, unknown>,
  res: CustomResponse<null>
): Promise<void> => {
  const source = "DELETE SUPPLY CONTROLLER";
  try {
    logger.info("Starting deleteSupplyController", {
      params: req.params,
    });
    const { supply_id } = req.params;
    const { admin_data, manager_data } = res.locals;

    const response = await deleteSupplyService(supply_id, {
      admin_data,
      manager_data,
    });

    if (response.errorMessage || response.status >= 300) {
      handleErrors({ response, res });
      return;
    }

    const resData = response.data as JSONResponseType<null>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      handleErrors({ res, error, source });
    } else {
      handleErrors({ res, error: new Error(String(error)), source });
    }
  }
};

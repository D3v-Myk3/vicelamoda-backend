import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import {
  createOrderService,
  fetchOrdersService,
  getOrderDetailsService,
  markBankTransferAsPaidService,
  updateOrderFulfillmentService,
} from "../services/order.service";
import {
  CustomRequest,
  CustomResponse,
  JSONResponseType,
} from "../types/general.types";
import { CreateOrderRequest, FetchOrdersType } from "../types/order.types";

export const createOrderController = async (
  req: CustomRequest<unknown, unknown, CreateOrderRequest, unknown>,
  res: CustomResponse<any>
): Promise<void> => {
  const source = "CREATE ORDER CONTROLLER";
  try {
    logger.info("Starting createOrderController", {
      body: req.body,
      path: req.originalUrl,
      ip: req.ip,
    });
    const { customer_data } = res.locals;
    const params = {
      ...req.body,
      user_id: customer_data?.user_id || req.body.user_id,
    };

    const response = await createOrderService(params, {
      user_data: customer_data,
    });

    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Create order failed", {
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
      logger.error("Error in createOrderController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in createOrderController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const fetchOrdersController = async (
  req: CustomRequest<unknown, unknown, unknown, FetchOrdersType>,
  res: CustomResponse<any[] | null>
): Promise<void> => {
  const source = "FETCH ORDERS CONTROLLER";
  try {
    logger.info("Starting fetchOrdersController", {
      query: req.query,
      path: req.originalUrl,
      ip: req.ip,
    });
    const params = req.query as FetchOrdersType;
    const { admin_data, manager_data, customer_data } = res.locals;

    const response = await fetchOrdersService(params, {
      admin_data,
      manager_data,
      user_data: customer_data,
    });

    if (
      (response?.data === null || response?.errorMessage) &&
      response?.status &&
      response?.status >= 300
    ) {
      logger.warn("Fetch orders failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response?.data as JSONResponseType<any[]>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in fetchOrdersController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in fetchOrdersController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const getOrderDetailsController = async (
  req: CustomRequest<{ order_id: string }, unknown, unknown, unknown>,
  res: CustomResponse<any>
): Promise<void> => {
  const source = "GET ORDER DETAILS CONTROLLER";
  try {
    logger.info("Starting getOrderDetailsController", {
      params: req.params,
      path: req.originalUrl,
      ip: req.ip,
    });
    const { order_id } = req.params;
    const { admin_data, manager_data, customer_data } = res.locals;

    const response = await getOrderDetailsService(
      { order_id },
      { admin_data, manager_data, user_data: customer_data }
    );

    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Get order details failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response?.data as JSONResponseType;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in getOrderDetailsController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in getOrderDetailsController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const updateOrderFulfillmentController = async (
  req: CustomRequest<
    { order_id: string },
    unknown,
    { fulfillment_status: string },
    unknown
  >,
  res: CustomResponse<any>
): Promise<void> => {
  const source = "UPDATE ORDER FULFILLMENT CONTROLLER";
  try {
    logger.info("Starting updateOrderFulfillmentController", {
      params: req.params,
      body: req.body,
      path: req.originalUrl,
      ip: req.ip,
    });
    const { order_id } = req.params;
    const { fulfillment_status } = req.body;
    const { admin_data, manager_data } = res.locals;

    const response = await updateOrderFulfillmentService(
      { order_id, fulfillment_status: fulfillment_status as any },
      { admin_data, manager_data }
    );

    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Update order fulfillment failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response?.data as JSONResponseType;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in updateOrderFulfillmentController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in updateOrderFulfillmentController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const markBankTransferAsPaidController = async (
  req: CustomRequest<{ order_id: string }, unknown, unknown, unknown>,
  res: CustomResponse<any>
): Promise<void> => {
  const source = "MARK BANK TRANSFER AS PAID CONTROLLER";
  try {
    logger.info("Starting markBankTransferAsPaidController", {
      params: req.params,
      path: req.originalUrl,
      ip: req.ip,
    });
    const { order_id } = req.params;
    const { admin_data, manager_data } = res.locals;

    const response = await markBankTransferAsPaidService(
      { order_id },
      { admin_data, manager_data }
    );

    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Mark bank transfer as paid failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response?.data as JSONResponseType;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in markBankTransferAsPaidController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in markBankTransferAsPaidController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { verifyPaymentService } from "../services/payment.service";
import {
  CustomRequest,
  CustomResponse,
  JSONResponseType,
} from "../types/general.types";

export const verifyPaymentController = async (
  req: CustomRequest<
    unknown,
    unknown,
    { reference: string; order_id: string },
    unknown
  >,
  res: CustomResponse<any>
): Promise<void> => {
  const source = "VERIFY PAYMENT CONTROLLER";
  try {
    logger.info("Starting verifyPaymentController", {
      body: req.body,
      path: req.originalUrl,
      ip: req.ip,
    });

    // We expect reference and order_id in the body
    const { reference, order_id } = req.body;

    const response = await verifyPaymentService(
      { reference, order_id },
      { user_data: res.locals.user_data } // Pass user data just in case, though not strict requirement for this service
    );

    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Payment verification failed", {
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
      logger.error("Error in verifyPaymentController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in verifyPaymentController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { SubscribeToNewsletterType } from "../schemas/newsletter.zod.schemas";
import {
  SubscribeToNewsletterResponse,
  subscribeToNewsletterService,
} from "../services/newsletter.service";
import {
  CustomRequest,
  CustomResponse,
  JSONResponseType,
} from "../types/general.types";

export const subscribeToNewsletterController = async (
  req: CustomRequest<unknown, unknown, SubscribeToNewsletterType>,
  res: CustomResponse<SubscribeToNewsletterResponse | null>
): Promise<void> => {
  const source = "SUBSCRIBE TO NEWSLETTER CONTROLLER";
  try {
    logger.info("Starting subscribeToNewsletterController", {
      body: req.body,
      path: req.originalUrl,
      ip: req.ip,
    });

    const { body } = req;

    const response = await subscribeToNewsletterService(body, {});

    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Subscription failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData =
      response?.data as JSONResponseType<SubscribeToNewsletterResponse>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in subscribeToNewsletterController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in subscribeToNewsletterController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

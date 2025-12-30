import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { NewsletterModel } from "../models/mongoose/Newsletter.model";
import { SubscribeToNewsletterType } from "../schemas/newsletter.zod.schemas";
import { CustomError, DefaultErrorReturn } from "../types/error.types";
import { ServiceFunctionParamType } from "../types/general.types";

export interface SubscribeToNewsletterResponse {
  message: string;
}

export const subscribeToNewsletterService: ServiceFunctionParamType<
  SubscribeToNewsletterType,
  SubscribeToNewsletterResponse
> = async (params) => {
  const source = "SUBSCRIBE TO NEWSLETTER SERVICE";
  logger.info("Starting subscribeToNewsletterService", {
    email: params.email,
  });

  try {
    const existingSubscription = await NewsletterModel.findOne({
      email: params.email,
    });

    if (existingSubscription) {
      throw new CustomError({
        data: null,
        errorMessage: "Email is already subscribed",
        source,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    await NewsletterModel.create({ email: params.email });

    return {
      data: {
        data: { message: "Subscribed successfully" },
        message: "Subscribed successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.CREATED,
    };
  } catch (error: CustomError | unknown) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  }
};

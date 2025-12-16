import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { UserLoginFormType } from "../schemas/access.zod.schemas";
import {
  userLoginService,
  userRegistrationService,
} from "../services/access.service";
import {
  CustomRequest,
  CustomResponse,
  JSONResponseType,
  Token,
} from "../types/general.types";
import { RegisterUserType, UserTblType } from "../types/user.type";

export const userRegistrationController = async (
  req: CustomRequest<unknown, unknown, RegisterUserType, unknown>,
  res: CustomResponse
): Promise<void> => {
  try {
    logger.info("Starting userRegistrationController", {
      body: req.body,
      ip: req.ip,
      path: req.originalUrl,
    });
    const params = req.body;

    const source = "OFFICE PERSONNEL LOGIN SERVICE";
    logger.info(`Initiating User Login`, {
      source,
      params,
    });

    const response = await userRegistrationService(params, {});

    const result = response!;

    if (
      (result?.data === null || result?.errorMessage) &&
      result?.status &&
      result?.status >= 300
    ) {
      logger.warn("User registration failed", {
        status: result.status,
        errorMessage: result.errorMessage,
      });
      handleErrors({ response: result, res });
      return;
    }

    const resData = result?.data as JSONResponseType;

    const { data, message } = resData;

    logger.info("User registered successful", {
      status: result.status,
      message,
    });

    res.status(result.status).json({ data, message });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in userRegistrationController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({
        res,
        error,
        source: "USER REGISTRATION CONTROLLER",
      });
    } else {
      logger.error("Unexpected error in userRegistrationController", {
        error: String(error),
      });
      defaultError("USER REGISTRATION CONTROLLER", error as string);
    }
  }
};

export const userLoginController = async (
  req: CustomRequest<unknown, unknown, UserLoginFormType, unknown>,
  res: CustomResponse<Token<Partial<UserTblType>> | null>
): Promise<void> => {
  const source = "USER LOGIN CONTROLLER";

  try {
    logger.info("Starting userLoginController", {
      body: req.body,
      ip: req.ip,
      path: req.originalUrl,
    });
    const params = req.body;

    logger.info(`Initiating User Login`, {
      source,
      params,
    });

    const response = await userLoginService(params, {});
    const result = response!;

    if (
      (result?.data === null || result?.errorMessage) &&
      result?.status &&
      result?.status >= 300
    ) {
      logger.warn("User login failed", {
        status: result.status,
        errorMessage: result.errorMessage,
      });
      handleErrors({ response: result, res });
      return;
    }

    const resData = result?.data as JSONResponseType<
      Token<Partial<UserTblType>>
    >;

    const { data, message } = resData;

    res.status(result.status).json({ data, message });
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in userLoginController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({
        res,
        error,
        source: "USER LOGIN CONTROLLER",
      });
    } else {
      logger.error("Unexpected error in userLoginController", {
        error: String(error),
      });
      defaultError("USER LOGIN CONTROLLER", error as string);
    }
  }
};

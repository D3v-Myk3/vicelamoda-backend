import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { firebaseAuthService } from "../services/firebase-auth.service";
import {
  CustomRequest,
  CustomResponse,
  JSONResponseType,
  Token,
} from "../types/general.types";
import { UserTblType } from "../types/user.type";

export const firebaseAuthController = async (
  req: CustomRequest<unknown, unknown, { idToken: string }, unknown>,
  res: CustomResponse<Token<Partial<UserTblType>> | null>
): Promise<void> => {
  const source = "FIREBASE AUTH CONTROLLER";

  try {
    logger.info("Starting firebaseAuthController", {
      ip: req.ip,
      path: req.originalUrl,
    });
    const params = req.body;

    if (!params.idToken) {
      res.status(400).json({
        data: null,
        message: "ID Token is required",
      });
      return;
    }

    const response = await firebaseAuthService(params, {});
    const result = response!;

    if (
      (result?.data === null || result?.errorMessage) &&
      result?.status &&
      result?.status >= 300
    ) {
      logger.warn("Firebase authentication failed", {
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
      logger.error("Error in firebaseAuthController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({
        res,
        error,
        source: "FIREBASE AUTH CONTROLLER",
      });
    } else {
      logger.error("Unexpected error in firebaseAuthController", {
        error: String(error),
      });
      defaultError("FIREBASE AUTH CONTROLLER", error as string);
    }
  }
};

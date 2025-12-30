import { NextFunction, Request } from "express";
import { matchedData } from "express-validator";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { JWT_ACCESS_KEY, JWT_ALGORITHM } from "../../configs/env.configs";
import { greenAnsiColor, logger } from "../../configs/logger.configs";
import { matchedHeadersDataOption } from "../../configs/sanitizer.configs";
import { defaultError, handleErrors } from "../../helpers/error.helpers";
import { isPersonnelAUserHelper } from "../../helpers/role.helpers";
import { fetchUsersModel } from "../../models/user.models";
import { CustomError, DefaultErrorReturn } from "../../types/error.types";
import { CustomResponse, JSONResponseType } from "../../types/general.types";
import { UserTblType } from "../../types/user.type";

// ========== USER AUTH ========== //
export const userAuthMiddleware = async (
  req: Request,
  res: CustomResponse,
  next: NextFunction
): Promise<void> => {
  const source = "USER AUTH CONTROLLER";
  try {
    const matched_data = matchedData(req, matchedHeadersDataOption);
    const token = matched_data["x-vcl-auth-token"] as string;

    if (!token) {
      logger.warn(
        `Unauthorized request to ${req.originalUrl}: No token provided`
      );
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ data: null, message: "Authorization Token is Required" });
      return;
    }

    logger.info(`Verifying JWT token`, {
      source: `${source} (TOKEN VERIFICATION)`,
    });

    const { user_id } = jwt.verify(token, JWT_ACCESS_KEY, {
      algorithms: [JWT_ALGORITHM],
    }) as { user_id: string };

    logger.info(`Token verified`, {
      source: `${source} (TOKEN VERIFICATION SUCCESS)`,
      user_id,
    });

    logger.info(`Fetching user data`, {
      source: `${source} (USER DATA FETCH)`,
      user_id,
    });

    const response = await fetchUsersModel(
      {
        user_id,
        constraints: {},
      },
      {}
    );

    if (
      (response?.data === null || response?.errorMessage) &&
      response?.status >= 300
    ) {
      logger.warn(`Failed to fetch user data`, {
        source: `${source} (USER DATA FETCH FAILED)`,
        user_id,
        errorMessage: response.errorMessage,
        status: response.status,
      });
      throw new CustomError(response as DefaultErrorReturn);
    }

    const [user] = response?.data as UserTblType[];

    if (!user) {
      logger.warn(`User not registered`, {
        source: `${source} (STAGE 1)`,
        user_id,
        errorMessage: "Not a Registered User",
        status: StatusCodes.UNAUTHORIZED,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Not a Registered User",
        source: `${source} (STAGE 1)`,
        status: StatusCodes.UNAUTHORIZED,
      });
    }

    logger.info(`Validating user visibility`, {
      source: `${source} (VISIBILITY CHECK)`,
      user_id,
      visible: user.visible,
    });

    if (user.visible === "No") {
      logger.warn(`User account blocked`, {
        source: `${source} (STAGE 2)`,
        user_id,
        errorMessage: "User Account Blocked",
        status: StatusCodes.FORBIDDEN,
      });
      throw new CustomError({
        data: null,
        errorMessage: "User Account Blocked",
        source: `${source} (STAGE 2)`,
        status: StatusCodes.FORBIDDEN,
      });
    }

    logger.info(`Validating user role`, {
      source: `${source} (ROLE CHECK)`,
      user_id,
      role: user.role,
    });

    if (!isPersonnelAUserHelper(user.role)) {
      logger.warn(`Not a user account`, {
        source: `${source} (STAGE 3)`,
        user_id,
        errorMessage: "Not a User Account",
        status: StatusCodes.UNAUTHORIZED,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Not a User Account",
        source: `${source} (STAGE 3)`,
        status: StatusCodes.UNAUTHORIZED,
      });
    }

    logger.info(`User authentication successful`, {
      source,
      user_id,
      role: user.role,
      status: StatusCodes.OK,
    });

    const result = {
      data: { data: user, message: "User Authentication Successful" },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };

    if (
      (result?.data === null || result?.errorMessage) &&
      result?.status &&
      result?.status >= 300
    ) {
      handleErrors({ response: result, res });
      return;
    }

    const resData = result.data as JSONResponseType<UserTblType>;

    logger.verbose(
      greenAnsiColor(
        `✔️ Authenticated User Personnel: ${resData.data.user_id}`
      ),
      { user_data: resData.data }
    );

    res.locals.user_data = resData.data;

    next();
  } catch (error) {
    if (error instanceof Error) {
      handleErrors({ res, error, source });
    } else {
      defaultError(source, error as string);
    }
  }
};

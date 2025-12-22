import { NextFunction, Request } from "express";
import { matchedData } from "express-validator";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { JWT_ACCESS_KEY, JWT_ALGORITHM } from "../../configs/env.configs";
import { greenAnsiColor, logger } from "../../configs/logger.configs";
// Prisma removed - using Mongoose models directly
import { matchedHeadersDataOption } from "../../configs/sanitizer.configs";
import { defaultError, handleErrors } from "../../helpers/error.helpers";
import { isPersonnelAnAdminHelper } from "../../helpers/role.helpers";
import { UserModel } from "../../models/mongoose";
import { fetchUsersModel } from "../../models/user.models";
import { CustomError, DefaultErrorReturn } from "../../types/error.types";
import { CustomResponse, JSONResponseType } from "../../types/general.types";
import { UserTblType } from "../../types/user.type";

// ========== ADMIN AUTH ========== //
export const adminAuthMiddleware = async (
  req: Request,
  res: CustomResponse,
  next: NextFunction
): Promise<void> => {
  const source = "ADMIN AUTH CONTROLLER";
  try {
    const matched_data = matchedData(req, matchedHeadersDataOption);
    const token = matched_data["x-vcl-ad-auth-token"] as string;
    console.log("Token: ", token);

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

    logger.info(`Fetching admin data`, {
      source: `${source} (ADMIN DATA FETCH)`,
      user_id,
    });

    /* const response = await fetchUsersModel(
      {
        user_id,
        constraints: { store: true },
      },
      {}
    );

    if (
      (response?.data === null || response?.errorMessage) &&
      response?.status >= 300
    ) {
      logger.warn(`Failed to fetch admin data`, {
        source: `${source} (ADMIN DATA FETCH FAILED)`,
        user_id,
        errorMessage: response.errorMessage,
        status: response.status,
      });
      throw new CustomError(response as DefaultErrorReturn);
    }

    const [admin] = response?.data as UserTblType[]; */

    const response = await UserModel.findById(user_id).lean().exec();
    const admin = response as unknown as UserTblType;

    if (!admin) {
      logger.warn(`Admin not registered`, {
        source: `${source} (STAGE 1)`,
        user_id,
        errorMessage: "Not a Registered Admin",
        status: StatusCodes.UNAUTHORIZED,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Not a Registered Admin",
        source: `${source} (STAGE 1)`,
        status: StatusCodes.UNAUTHORIZED,
      });
    }

    logger.info(`Validating admin visibility`, {
      source: `${source} (VISIBILITY CHECK)`,
      user_id,
      visible: admin.visible,
    });

    if (admin.visible === "No") {
      logger.warn(`Admin account blocked`, {
        source: `${source} (STAGE 2)`,
        user_id,
        errorMessage: "Admin Account Blocked",
        status: StatusCodes.FORBIDDEN,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Admin Account Blocked",
        source: `${source} (STAGE 2)`,
        status: StatusCodes.FORBIDDEN,
      });
    }

    logger.info(`Validating admin role`, {
      source: `${source} (ROLE CHECK)`,
      user_id,
      role: admin.role,
    });

    if (!isPersonnelAnAdminHelper(admin.role)) {
      logger.warn(`Not a admin account`, {
        source: `${source} (STAGE 3)`,
        user_id,
        errorMessage: "Invalid Credentials",
        status: StatusCodes.UNAUTHORIZED,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Invalid Credentials",
        source: `${source} (STAGE 3)`,
        status: StatusCodes.UNAUTHORIZED,
      });
    }

    logger.info(`Admin authentication successful`, {
      source,
      user_id,
      role: admin.role,
      status: StatusCodes.OK,
    });

    const result = {
      data: { data: admin, message: "Admin Authentication Successful" },
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
        `✔️ Authenticated Admin Personnel: ${resData.data.user_id}`
      ),
      { admin_data: resData.data }
    );

    res.locals.admin_data = resData.data;

    next();
  } catch (error) {
    console.log(error);

    if (error instanceof Error) {
      handleErrors({ res, error, source });
    } else {
      defaultError(source, error as string);
    }
  }
};

// ========== MANAGER AUTH ========== //
export const managerAuthMiddleware = async (
  req: Request,
  res: CustomResponse,
  next: NextFunction
): Promise<void> => {
  const source = "MANAGER AUTH CONTROLLER";
  try {
    const matched_data = matchedData(req, matchedHeadersDataOption);
    const token = matched_data["chv-mng-auth-token"] as string;

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

    logger.info(`Fetching manager data`, {
      source: `${source} (MANAGER DATA FETCH)`,
      user_id,
    });

    const managerResponse = await fetchUsersModel(
      {
        user_id,
        constraints: { store: true },
      },
      {}
    );

    if (
      (managerResponse?.data === null || managerResponse?.errorMessage) &&
      managerResponse?.status >= 300
    ) {
      logger.warn(`Failed to fetch manager data`, {
        source: `${source} (MANAGER DATA FETCH FAILED)`,
        user_id,
        errorMessage: managerResponse.errorMessage,
        status: managerResponse.status,
      });
      throw new CustomError(managerResponse as DefaultErrorReturn);
    }

    const [manager] = managerResponse?.data as UserTblType[];

    if (!manager) {
      logger.warn(`Manager not registered`, {
        source: `${source} (STAGE 1)`,
        user_id,
        errorMessage: "Not a Registered Manager",
        status: StatusCodes.UNAUTHORIZED,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Not a Registered Manager",
        source: `${source} (STAGE 1)`,
        status: StatusCodes.UNAUTHORIZED,
      });
    }

    logger.info(`Validating manager visibility`, {
      source: `${source} (VISIBILITY CHECK)`,
      user_id,
      visible: manager.visible,
    });

    if (manager.visible === "No") {
      logger.warn(`Manager account blocked`, {
        source: `${source} (STAGE 2)`,
        user_id,
        errorMessage: "Manager Account Blocked",
        status: StatusCodes.FORBIDDEN,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Manager Account Blocked",
        source: `${source} (STAGE 2)`,
        status: StatusCodes.FORBIDDEN,
      });
    }

    logger.info(`Validating manager role`, {
      source: `${source} (ROLE CHECK)`,
      user_id,
      role: manager.role,
    });

    if (!isPersonnelAnAdminHelper(manager.role)) {
      logger.warn(`Not a manager account`, {
        source: `${source} (STAGE 3)`,
        user_id,
        errorMessage: "Invalid Credentials",
        status: StatusCodes.UNAUTHORIZED,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Invalid Credentials",
        source: `${source} (STAGE 3)`,
        status: StatusCodes.UNAUTHORIZED,
      });
    }

    logger.info(`Manager authentication successful`, {
      source,
      user_id,
      role: manager.role,
      status: StatusCodes.OK,
    });

    const result = {
      data: { data: manager, message: "Manager Authentication Successful" },
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
        `✔️ Authenticated Admin Personnel: ${resData.data.user_id}`
      ),
      { manager_data: resData.data }
    );

    res.locals.manager_data = resData.data;

    next();
  } catch (error) {
    if (error instanceof Error) {
      handleErrors({ res, error, source });
    } else {
      defaultError(source, error as string);
    }
  }
};

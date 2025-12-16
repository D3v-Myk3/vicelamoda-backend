import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRY,
  JWT_ACCESS_KEY,
  JWT_ALGORITHM,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_KEY,
} from "../configs/env.configs";
import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { StoreModel } from "../models/mongoose/Store.model";
import { UserModel } from "../models/mongoose/User.model";
import { UserLoginFormType } from "../schemas/access.zod.schemas";
import { CustomError, DefaultErrorReturn } from "../types/error.types";
import { ServiceFunctionParamType, Token } from "../types/general.types";
import { StoreTblType } from "../types/store.types";
import { RegisterUserType, UserTblType } from "../types/user.type";
import { argon2ComparePassword, argon2HashPassword } from "../utils/hash.utils";

export const userRegistrationService: ServiceFunctionParamType<
  RegisterUserType
> = async (params) => {
  const source = "USER REGISTRATION SERVICE";
  logger.info(`Initiating User Registration`, {
    source,
    params,
  });

  try {
    logger.info(`Registering user`, {
      source: `${source} (MODEL CALL)`,
      params,
    });

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      email: params.email,
    })
      .lean()
      .exec();

    if (existingUser) {
      logger.info(`User already exists`, {
        source: `${source} (STAGE 1)`,
        params,
        errorMessage: "User already exists",
        status: StatusCodes.BAD_REQUEST,
      });
      throw new CustomError({
        data: null,
        errorMessage: "User already exists",
        source: `${source} (STAGE 1)`,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    const hashedPassword = await argon2HashPassword(params.password);

    logger.info(`Registering user`, {
      source: `${source} (PASSWORD CHECK)`,
      params,
    });

    const register_user_response = await UserModel.create({
      fullname: params.fullname,
      email: params.email,
      password: hashedPassword,
      role: "CUSTOMER",
      store_id: params.store_id ?? undefined,
    });

    const user_result =
      register_user_response.toObject() as unknown as UserTblType;

    if (!user_result) {
      logger.warn(`No user registered`, {
        source: `${source} (USER REGISTRATION)`,
        email: params.email,
        errorMessage: `${params.fullname} Not Registered`,
        status: StatusCodes.NOT_IMPLEMENTED,
      });
      throw new CustomError({
        data: null,
        errorMessage: `${params.fullname} Not Registered`,
        source: `${source} (USER REGISTRATION)`,
        status: StatusCodes.NOT_IMPLEMENTED,
      });
    }
    logger.info(`User registered successfully`, {
      source: `${source} (USER REGISTRATION SUCCESS)`,
      email: params.email,
      user_id: user_result.user_id,
    });

    logger.info(`User registration successful`, {
      source,
      email: params.email,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: "User registration successful",
        message: "User registration successful",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in user registration`, {
      source: `${source} (ERROR)`,
      personnel: params.email,
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

export const userLoginService: ServiceFunctionParamType<
  UserLoginFormType,
  Token<Partial<UserTblType>>
> = async (params) => {
  const source = "USER LOGIN SERVICE";
  logger.info(`Initiating User Login`, {
    source,
    params,
  });

  try {
    logger.info(`Logging user in`, {
      source: `${source} (MODEL CALL)`,
      params,
    });

    const response = await UserModel.findOne({
      email: params.email,
    })
      .populate({
        path: "store",
        // model: StoreModel,
        select: "store_id name address phone manager_id",
      })
      .lean()
      .exec();

    const rest = response as unknown as UserTblType;
    const user_store = rest.store;

    if (!rest) {
      logger.info(`Email verification failed`, {
        source: `${source} (STAGE 1)`,
        params,
        errorMessage: "Incorrect details",
        status: StatusCodes.BAD_REQUEST,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Incorrect details",
        source: `${source} (STAGE 1)`,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    const verifyPassword = await argon2ComparePassword(
      params.password,
      rest.password
    );

    if (!verifyPassword) {
      logger.info(`Password verification failed`, {
        source: `${source} (STAGE 2)`,
        errorMessage: "Incorrect Details",
        status: StatusCodes.BAD_REQUEST,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Incorrect Details",
        source: `${source} (STAGE 2)`,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    if (rest.visible === "No") {
      logger.info(`Personnel disabled`, {
        source: `${source} (STAGE 3)`,
        errorMessage: "Personnel Disabled",
        status: StatusCodes.FORBIDDEN,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Personnel Disabled",
        source: `${source} (STAGE 3)`,
        status: StatusCodes.FORBIDDEN,
      });
    }

    logger.info(`Generating access token`, {
      source: `${source} (TOKEN GENERATION)`,
      email: params.email,
    });

    const accessToken = jwt.sign(
      { user_id: rest._id, role: rest.role },
      JWT_ACCESS_KEY!,
      { algorithm: JWT_ALGORITHM!, expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    logger.info(`Generating refresh token`, {
      source: `${source} (REFRESH TOKEN GENERATION)`,
      user_id: rest._id,
    });

    const refreshToken = jwt.sign(
      { user_id: rest._id, role: rest.role },
      REFRESH_TOKEN_KEY!,
      { algorithm: JWT_ALGORITHM!, expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // Fetch stores based on role
    const storeResponse =
      rest.role === "ADMIN"
        ? await StoreModel.find()
            .sort({ createdAt: -1 })
            .populate({
              path: "manager_id",
              model: UserModel,
              select: "user_id fullname email role",
            })
            .lean()
            .exec()
        : [];

    console.log("STORE RESPONSE", storeResponse);

    const stores = storeResponse as unknown as StoreTblType[];

    logger.info(`Login successful`, {
      source,
      email: params.email,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: {
          refreshToken,
          accessToken,
          account_data: rest,
          // user_store: Array.isArray(user_store) ? user_store : [store],
          user_store: user_store ? [user_store] : stores,
        } as Token<Partial<UserTblType>>,
        message: "Login successful",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in user login`, {
      source: `${source} (ERROR)`,
      personnel: params.email,
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

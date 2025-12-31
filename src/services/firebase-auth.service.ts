import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRY,
  JWT_ACCESS_KEY,
  JWT_ALGORITHM,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_KEY,
} from "../configs/env.configs";
import { firebaseAuth } from "../configs/firebase.configs";
import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { StoreModel } from "../models/mongoose/Store.model";
import { UserModel, UserRole } from "../models/mongoose/User.model";
import { CustomError, DefaultErrorReturn } from "../types/error.types";
import { ServiceFunctionParamType, Token } from "../types/general.types";
import { StoreTblType } from "../types/store.types";
import { UserTblType } from "../types/user.type";
import { argon2HashPassword } from "../utils/hash.utils";

export const firebaseAuthService: ServiceFunctionParamType<
  { idToken: string },
  Token<Partial<UserTblType>>
> = async (params) => {
  const source = "FIREBASE AUTH SERVICE";
  logger.info(`Initiating Firebase Auth`, {
    source,
  });

  try {
    // 1. Verify Firebase ID Token
    const decodedToken = await firebaseAuth.verifyIdToken(params.idToken);
    const { email, name, picture, uid } = decodedToken;

    if (!email) {
      throw new CustomError({
        data: null,
        errorMessage: "Email not provided by Firebase",
        source: `${source} (TOKEN VERIFICATION)`,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    logger.info(`Firebase token verified for email: ${email}`, {
      source,
      uid,
    });

    // 2. Find or Create User in MongoDB
    let user = await UserModel.findOne({ email }).populate({
      path: "store",
      select: "store_id name address phone manager_id",
    });

    if (!user) {
      logger.info(`Creating new user for ${email}`, { source });

      // Generate a random password for social login users (they won't use it directly)
      const randomPassword = Math.random().toString(36).slice(-16);
      const hashedPassword = await argon2HashPassword(randomPassword);

      user = await UserModel.create({
        fullname: name || email.split("@")[0],
        email: email,
        password: hashedPassword,
        role: UserRole.CUSTOMER,
        // profile_picture: picture, // Could add this if field exists
      });
    }

    if (user.visible === "No") {
      throw new CustomError({
        data: null,
        errorMessage: "Account disabled",
        source: `${source} (VISIBILITY CHECK)`,
        status: StatusCodes.FORBIDDEN,
      });
    }

    const rest = user.toObject() as unknown as UserTblType;
    const user_store = rest.store ? rest.store : undefined;

    // 3. Generate App Tokens (same as regular login)
    const accessToken = jwt.sign(
      { user_id: rest._id.toString(), role: rest.role },
      JWT_ACCESS_KEY!,
      { algorithm: JWT_ALGORITHM!, expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { user_id: rest._id.toString(), role: rest.role },
      REFRESH_TOKEN_KEY!,
      { algorithm: JWT_ALGORITHM!, expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // Fetch stores for Admin (standard app logic)
    const stores =
      rest.role === UserRole.ADMIN
        ? ((await StoreModel.find()
            .sort({ createdAt: -1 })
            .populate({
              path: "manager_id",
              model: UserModel,
              select: "user_id fullname email role",
            })
            .lean()
            .exec()) as unknown as StoreTblType[])
        : [];

    logger.info(`Firebase login successful for ${email}`, {
      source,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: {
          refreshToken,
          accessToken,
          account_data: rest,
          user_store: user_store ? [user_store] : stores,
        } as Token<Partial<UserTblType>>,
        message: "Login successful",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: any) {
    logger.error(`Error in firebase auth service`, {
      source,
      error: error.message,
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

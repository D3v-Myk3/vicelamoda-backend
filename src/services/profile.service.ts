import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { UserModel } from "../models/mongoose";
import { CustomError, DefaultErrorReturn } from "../types/error.types";
import { ServiceFunctionParamType } from "../types/general.types";
import {
  UpdatePasswordType,
  UpdateUserProfileType,
  UserTblType,
} from "../types/user.type";
import { argon2ComparePassword, argon2HashPassword } from "../utils/hash.utils";

export const updateUserProfileService: ServiceFunctionParamType<
  UpdateUserProfileType,
  UserTblType
> = async (params, { user_data }) => {
  const source = "UPDATE USER PROFILE SERVICE";
  logger.info("Starting updateUserProfileService", {
    user_id: user_data!.user_id,
  });

  try {
    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: user_data?._id }, // Assuming user_id is the lookup field
      { $set: params },
      { new: true }
    ).lean();

    if (!updatedUser) {
      throw new CustomError({
        data: null,
        errorMessage: "User not found",
        source,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    const { password, visible, ...safeUser } =
      updatedUser as unknown as UserTblType;

    return {
      data: {
        data: safeUser as UserTblType,
        message: "Profile updated successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  }
};

export const updatePasswordService: ServiceFunctionParamType<
  UpdatePasswordType,
  null
> = async (params, { user_data, admin_data, manager_data }) => {
  const source = "UPDATE PASSWORD SERVICE";
  logger.info("Starting updatePasswordService", {
    // user_id: user!.user_id,
  });

  try {
    const userContextData = user_data || admin_data || manager_data;

    if (!userContextData) {
      throw new CustomError({
        data: null,
        errorMessage: "User not authorised",
        source,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    const user = await UserModel.findById(userContextData!._id).select(
      "+password"
    );

    if (!user) {
      throw new CustomError({
        data: null,
        errorMessage: "User not found",
        source,
        status: StatusCodes.NOT_FOUND,
      });
    }

    const isMatch = await argon2ComparePassword(
      params.old_password,
      user.password
    );

    if (!isMatch) {
      throw new CustomError({
        data: null,
        errorMessage: "Incorrect old password",
        source,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    const hashedPassword = await argon2HashPassword(params.new_password);
    user.password = hashedPassword;
    await user.save();

    return {
      data: {
        data: null,
        message: "Password updated successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  }
};

export const updateAdminProfileService: ServiceFunctionParamType<
  UpdateUserProfileType,
  UserTblType
> = async (params, { admin_data }) => {
  const source = "UPDATE ADMIN PROFILE SERVICE";
  logger.info("Starting updateAdminProfileService", {
    admin_id: admin_data!.user_id,
  });

  try {
    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: admin_data?._id }, // Assuming user_id is the lookup field
      { $set: params },
      { new: true }
    ).lean();

    if (!updatedUser) {
      throw new CustomError({
        data: null,
        errorMessage: "Admin not found",
        source,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    const { password, visible, ...safeUser } =
      updatedUser as unknown as UserTblType;

    return {
      data: {
        data: safeUser as UserTblType,
        message: "Profile updated successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  }
};

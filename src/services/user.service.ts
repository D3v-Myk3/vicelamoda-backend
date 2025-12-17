import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { UserModel } from "../models/mongoose";
import { CustomError, DefaultErrorReturn } from "../types/error.types";
import { ServiceFunctionParamType } from "../types/general.types";
import { UpdateUserProfileType, UserTblType } from "../types/user.type";

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

    const { password, visible, _id, ...safeUser } =
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

import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import {
  updateAdminProfileService,
  updatePasswordService,
  updateUserProfileService,
} from "../services/profile.service";
import {
  CustomRequest,
  CustomResponse,
  JSONResponseType,
} from "../types/general.types";
import {
  UpdatePasswordType,
  UpdateUserProfileType,
  UserTblType,
} from "../types/user.type";

export const updateUserProfileController = async (
  req: CustomRequest<unknown, unknown, UpdateUserProfileType>,
  res: CustomResponse<UserTblType | null>
): Promise<void> => {
  const source = "UPDATE USER PROFILE CONTROLLER";
  try {
    logger.info("Starting updateUserProfileController", {
      body: req.body,
    });
    const { body } = req;
    const { user_data } = res.locals;

    const response = await updateUserProfileService(body, { user_data });

    if (!response.data || response.errorMessage || response.status >= 300) {
      handleErrors({ response, res: res as any, source });
      return;
    }

    const resData = response.data as JSONResponseType<UserTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      handleErrors({ res, error, source });
    } else {
      defaultError(source, error as string);
    }
  }
};

export const updatePasswordController = async (
  req: CustomRequest<unknown, unknown, UpdatePasswordType>,
  res: CustomResponse<null>
): Promise<void> => {
  const source = "UPDATE PASSWORD CONTROLLER";
  try {
    logger.info("Starting updatePasswordController", {
      body: req.body,
    });
    const { body } = req;
    const { user_data, admin_data, manager_data } = res.locals;

    const response = await updatePasswordService(body, {
      user_data,
      admin_data,
      manager_data,
    });

    if (response.errorMessage || response.status >= 300) {
      handleErrors({ response, res: res as any, source });
      return;
    }

    const resData = response.data as JSONResponseType<null>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      handleErrors({ res, error, source });
    } else {
      defaultError(source, error as string);
    }
  }
};

export const updateAdminProfileController = async (
  req: CustomRequest<unknown, unknown, UpdateUserProfileType>,
  res: CustomResponse<UserTblType | null>
): Promise<void> => {
  const source = "UPDATE ADMIN PROFILE CONTROLLER";
  try {
    logger.info("Starting updateAdminProfileController", {
      body: req.body,
    });
    const { body } = req;
    const { admin_data } = res.locals;

    const response = await updateAdminProfileService(body, { admin_data });

    if (!response.data || response.errorMessage || response.status >= 300) {
      handleErrors({ response, res: res as any, source });
      return;
    }

    const resData = response.data as JSONResponseType<UserTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      handleErrors({ res, error, source });
    } else {
      defaultError(source, error as string);
    }
  }
};

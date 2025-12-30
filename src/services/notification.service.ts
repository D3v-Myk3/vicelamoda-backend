import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { NotificationModel } from "../models/mongoose/Notification.model";
import { CustomError, DefaultErrorReturn } from "../types/error.types";
import { ServiceFunctionParamType } from "../types/general.types";
import {
  FetchNotificationsParams,
  NotificationTblType,
} from "../types/notification.type";

export const fetchNotificationsService: ServiceFunctionParamType<
  FetchNotificationsParams,
  { notifications: NotificationTblType[]; total: number }
> = async (params, { admin_data, manager_data }) => {
  const source = "FETCH NOTIFICATIONS SERVICE";
  logger.info("Starting fetchNotificationsService", {
    // user_id: user_data!.user_id,
  });

  try {
    const user_data = admin_data || manager_data;
    console.log(user_data);
    const { recipient, ...otherParams } = params;
    const query = { recipient: user_data!._id, ...otherParams };
    const limit = params.limit || 20;
    const offset = params.offset || 0;

    const [notifications, total] = await Promise.all([
      NotificationModel.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      NotificationModel.countDocuments({ recipient: user_data!._id }),
    ]);

    return {
      data: {
        data: {
          notifications: notifications as unknown as NotificationTblType[],
          total,
        },
        message: "Notifications fetched successfully",
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

export const markNotificationAsReadService: ServiceFunctionParamType<
  { notification_id: string },
  NotificationTblType
> = async (params, { user_data }) => {
  const source = "MARK NOTIFICATION AS READ SERVICE";
  logger.info("Starting markNotificationAsReadService", {
    notification_id: params.notification_id,
  });

  try {
    const updatedNotification = await NotificationModel.findOneAndUpdate(
      { _id: params.notification_id, recipient: user_data!._id },
      { $set: { read: true } },
      { new: true }
    ).lean();

    if (!updatedNotification) {
      throw new CustomError({
        data: null,
        errorMessage: "Notification not found",
        source,
        status: StatusCodes.NOT_FOUND,
      });
    }

    return {
      data: {
        data: updatedNotification as unknown as NotificationTblType,
        message: "Notification marked as read",
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

export const markAllNotificationsAsReadService: ServiceFunctionParamType<
  {},
  { modifiedCount: number }
> = async (_, { user_data }) => {
  const source = "MARK ALL NOTIFICATIONS AS READ SERVICE";
  logger.info("Starting markAllNotificationsAsReadService", {
    user_id: user_data!.user_id,
  });

  try {
    const result = await NotificationModel.updateMany(
      { recipient: user_data!._id, read: false },
      { $set: { read: true } }
    );

    return {
      data: {
        data: { modifiedCount: result.modifiedCount },
        message: "All notifications marked as read",
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

import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import {
  fetchNotificationsService,
  markAllNotificationsAsReadService,
  markNotificationAsReadService,
} from "../services/notification.service";
import {
  CustomRequest,
  CustomResponse,
  JSONResponseType,
} from "../types/general.types";
import {
  FetchNotificationsParams,
  NotificationTblType,
} from "../types/notification.type";

export const fetchNotificationsController = async (
  req: CustomRequest<unknown, unknown, unknown, FetchNotificationsParams>,
  res: CustomResponse<{ notifications: NotificationTblType[]; total: number }>
): Promise<void> => {
  const source = "FETCH NOTIFICATIONS CONTROLLER";
  try {
    logger.info("Starting fetchNotificationsController", {
      query: req.query,
    });
    const params = req.query;
    const { admin_data, manager_data } = res.locals;

    const response = await fetchNotificationsService(params, {
      admin_data,
      manager_data,
    });

    if (!response.data || response.errorMessage || response.status >= 300) {
      handleErrors({ response, res: res as any, source });
      return;
    }

    const resData = response.data as JSONResponseType<{
      notifications: NotificationTblType[];
      total: number;
    }>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      handleErrors({ res: res as any, error, source });
    } else {
      defaultError(source, error as string);
    }
  }
};

export const markNotificationAsReadController = async (
  req: CustomRequest<{ id: string }>,
  res: CustomResponse<NotificationTblType | null>
): Promise<void> => {
  const source = "MARK NOTIFICATION AS READ CONTROLLER";
  try {
    const { id } = req.params;
    const { admin_data, manager_data } = res.locals;

    const response = await markNotificationAsReadService(
      { notification_id: id },
      { admin_data, manager_data }
    );

    if (!response.data || response.errorMessage || response.status >= 300) {
      handleErrors({ response, res: res as any, source });
      return;
    }

    const resData = response.data as JSONResponseType<NotificationTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      handleErrors({ res: res as any, error, source });
    } else {
      defaultError(source, error as string);
    }
  }
};

export const markAllNotificationsAsReadController = async (
  _req: CustomRequest,
  res: CustomResponse<{ modifiedCount: number }>
): Promise<void> => {
  const source = "MARK ALL NOTIFICATIONS AS READ CONTROLLER";
  try {
    const { admin_data, manager_data } = res.locals;

    const response = await markAllNotificationsAsReadService(
      {},
      { admin_data, manager_data }
    );

    if (!response.data || response.errorMessage || response.status >= 300) {
      handleErrors({ response, res: res as any, source });
      return;
    }

    const resData = response.data as JSONResponseType<{
      modifiedCount: number;
    }>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      handleErrors({ res: res as any, error, source });
    } else {
      defaultError(source, error as string);
    }
  }
};

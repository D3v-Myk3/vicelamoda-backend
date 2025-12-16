import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { getDashboardStatsService } from "../services/admin.dashboard.service";
import { AdminDashboardStats } from "../types/dashboard.types";
import {
  CustomRequest,
  CustomResponse,
  JSONResponseType,
} from "../types/general.types";

export const getDashboardStatsController = async (
  _req: CustomRequest<unknown, unknown, unknown, unknown>,
  res: CustomResponse<AdminDashboardStats>
) => {
  const source = "GET DASHBOARD STATS CONTROLLER";
  logger.info(`Starting getDashboardStatsController`, { source });
  try {
    const { admin_data, manager_data } = res.locals;

    const response = await getDashboardStatsService(undefined, {
      admin_data,
      manager_data,
    });

    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Fetch dashboard stats failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      // Cast res to any to avoid strict type mismatch with handleErrors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleErrors({ response, res: res as any });
      return;
    }

    const resData = response.data as JSONResponseType<AdminDashboardStats>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in getDashboardStatsController", {
        error: error.message,
        stack: error.stack,
      });
      // Cast res to any to avoid strict type mismatch with handleErrors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleErrors({ res: res as any, error, source });
    } else {
      logger.error("Unexpected error in getDashboardStatsController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

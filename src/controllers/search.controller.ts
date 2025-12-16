import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { OrderModel } from "../models/mongoose/Order.model";
import { ProductModel } from "../models/mongoose/Product.model";
import { SupplyModel } from "../models/mongoose/Supply.model";
import { CustomError, DefaultErrorReturn } from "../types/error.types";
import {
  CustomRequest,
  CustomResponse,
  JSONResponseType,
  ServiceFunctionParamType,
} from "../types/general.types";

export interface GlobalSearchParams {
  query?: string;
  types?: ("products" | "orders" | "supplies")[];
  limit?: number;
}

export const globalSearchService: ServiceFunctionParamType<
  GlobalSearchParams,
  any
> = async (params) => {
  const source = "GLOBAL SEARCH SERVICE";
  logger.info("Starting globalSearchService", { body: params });

  try {
    const searchQuery = params.query;
    const types = params.types || ["products", "orders", "supplies"];
    const limit = Number(params.limit) || 10;

    const results: any = {
      products: [],
      orders: [],
      supplies: [],
    };

    // Search products
    if (types.includes("products")) {
      const products = await ProductModel.find({
        $or: [
          { name: { $regex: searchQuery, $options: "i" } },
          { sku: { $regex: searchQuery, $options: "i" } },
          { description: { $regex: searchQuery, $options: "i" } },
        ],
      })
        .limit(limit)
        .lean()
        .exec();
      results.products = products;
    }

    // Search orders
    if (types.includes("orders")) {
      const orders = await OrderModel.find({
        $or: [
          { order_id: { $regex: searchQuery, $options: "i" } },
          { "shipping_address.email": { $regex: searchQuery, $options: "i" } },
          {
            "shipping_address.fullname": { $regex: searchQuery, $options: "i" },
          },
        ],
      })
        .limit(limit)
        .lean()
        .exec();
      results.orders = orders;
    }

    // Search supplies
    if (types.includes("supplies")) {
      const supplies = await SupplyModel.find({
        $or: [
          { supply_id: { $regex: searchQuery, $options: "i" } },
          { supplier_name: { $regex: searchQuery, $options: "i" } },
          { supplier_contact: { $regex: searchQuery, $options: "i" } },
        ],
      })
        .limit(limit)
        .lean()
        .exec();
      results.supplies = supplies;
    }

    return {
      data: {
        data: results,
        message: "Search completed successfully",
      },
      errorMessage: null,
      status: StatusCodes.OK,
      source,
    };
  } catch (error: any) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    }
    return defaultError(source, String(error));
  }
};

export const globalSearchController = async (
  req: CustomRequest<unknown, unknown, unknown, GlobalSearchParams>,
  res: CustomResponse
): Promise<void> => {
  const source = "GLOBAL SEARCH CONTROLLER";
  try {
    logger.info("Starting globalSearchController", {
      query: req.query,
      path: req.originalUrl,
      ip: req.ip,
    });
    const params = req.query as GlobalSearchParams;

    if (!params.query) {
      res.status(StatusCodes.BAD_REQUEST).json({
        data: null,
        message: "Search query is required",
      });
      // return;
    }

    const response = await globalSearchService(params, {});

    if (
      (response?.data === null || response?.errorMessage) &&
      response?.status &&
      response?.status >= 300
    ) {
      logger.warn("Global search failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      // return;
    }

    const resData = response?.data as JSONResponseType;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in globalSearchController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in globalSearchController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

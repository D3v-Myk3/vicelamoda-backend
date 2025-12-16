import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger.configs";
import { paginationConfig } from "../configs/pagination.config";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import {
  FulfillmentStatus,
  OrderModel,
  PaymentMethod,
  PaymentStatus,
} from "../models/mongoose/Order.model";
import { ProductModel } from "../models/mongoose/Product.model";
import { CustomError, DefaultErrorReturn } from "../types/error.types";
import { ServiceFunctionParamType } from "../types/general.types";
import {
  CreateOrderRequest,
  CreateOrderResponse,
  FetchOrdersType,
  OrderTblType,
  UpdateOrderResponse,
  UpdateOrderType,
} from "../types/order.types";

export const createOrderService: ServiceFunctionParamType<
  CreateOrderRequest,
  CreateOrderResponse
> = async (params) => {
  const source = "CREATE ORDER SERVICE";
  logger.info("Starting createOrderService", { body: params });

  try {
    let total_amount = 0;
    const orderItems = [];

    // Process each item sequentially to handle stock updates correctly
    for (const item of params.items) {
      const product = await ProductModel.findOne({
        product_id: item.product_id,
      }).exec();

      if (!product) {
        throw new CustomError({
          data: null,
          errorMessage: `Product ${item.product_id} not found`,
          source,
          status: StatusCodes.BAD_REQUEST,
        });
      }

      let unit_price = 0;
      let line_total = 0;
      let variant_name = "";

      if (item.variant_sku) {
        // Handle Variant Product
        const variant = product.variants.find(
          (v) => v.sku === item.variant_sku
        );

        if (!variant) {
          throw new CustomError({
            data: null,
            errorMessage: `Variant ${item.variant_sku} not found for product ${product.name}`,
            source,
            status: StatusCodes.BAD_REQUEST,
          });
        }

        // Calculate total variant stock across all stores
        const totalVariantStock = variant.stocks.reduce(
          (sum, s) => sum + s.stock,
          0
        );

        if (totalVariantStock < item.quantity) {
          throw new CustomError({
            data: null,
            errorMessage: `Insufficient stock for variance ${variant.sku}. Available: ${totalVariantStock}`,
            source,
            status: StatusCodes.BAD_REQUEST,
          });
        }

        // Deduct stock from stores (First Available Strategy)
        let remainingqty = item.quantity;
        for (const storeStock of variant.stocks) {
          if (remainingqty <= 0) break;
          if (storeStock.stock > 0) {
            const deduct = Math.min(storeStock.stock, remainingqty);
            storeStock.stock -= deduct;
            remainingqty -= deduct;
          }
        }

        unit_price = variant.price;
        variant_name = `${product.name} - ${variant.size}`;
        if (variant.attributes && variant.attributes.length > 0) {
          variant_name += ` (${variant.attributes.map((a) => `${a.key}: ${a.value}`).join(", ")})`;
        }
      } else {
        // Handle Standard Product (Non-variant)
        if (product.quantity_in_stock < item.quantity) {
          throw new CustomError({
            data: null,
            errorMessage: `Insufficient stock for product ${product.name}`,
            source,
            status: StatusCodes.BAD_REQUEST,
          });
        }

        product.quantity_in_stock -= item.quantity;
        unit_price = Number(product.selling_price);
      }

      line_total = unit_price * item.quantity;
      total_amount += line_total;

      orderItems.push({
        product_id: item.product_id,
        variant_sku: item.variant_sku,
        variant_name: variant_name || undefined,
        quantity: item.quantity,
        unit_price,
        line_total,
      });

      // Save the product to persist stock changes and trigger middleware (which recalculates total stock)
      await product.save();
    }

    // Determine payment status based on payment method
    let payment_status: PaymentStatus = PaymentStatus.PENDING;
    if (params.payment_method === PaymentMethod.CASH_ON_DELIVERY) {
      payment_status = PaymentStatus.PENDING;
    } else if (params.payment_method === PaymentMethod.BANK_TRANSFER) {
      payment_status = PaymentStatus.AWAITING_BANK_TRANSFER;
    } else if (params.payment_method === PaymentMethod.STRIPE) {
      payment_status = PaymentStatus.PENDING;
    }

    // Create order
    const order = await OrderModel.create({
      user_id: params.user_id,
      shipping_address: params.shipping_address,
      items: orderItems,
      total_amount,
      payment_method: params.payment_method,
      payment_status,
      fulfillment_status: FulfillmentStatus.PENDING,
    });

    return {
      data: {
        data: {
          order_id: order.order_id,
          total_amount: order.total_amount,
          payment_status: order.payment_status,
          fulfillment_status: order.fulfillment_status,
          createdAt: order.createdAt,
        },
        message: "Order created successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.CREATED,
    };
  } catch (error: any) {
    logger.error(`Error in createOrderService`, {
      source,
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    }
    return defaultError(source, String(error));
  }
};

export const fetchOrdersService: ServiceFunctionParamType<
  FetchOrdersType,
  OrderTblType[]
> = async (params) => {
  const source = "FETCH ORDERS SERVICE";
  logger.info("Starting fetchOrdersService", { body: params });

  try {
    const limit = Number(params.limit) ?? paginationConfig.defaultLimit;
    const cursor = params.cursor;

    const query: any = {};

    if (params.order_id) query.order_id = params.order_id;
    if (params.user_id) query.user_id = params.user_id;
    if (params.payment_method) query.payment_method = params.payment_method;
    if (params.payment_status) query.payment_status = params.payment_status;
    if (params.fulfillment_status)
      query.fulfillment_status = params.fulfillment_status;

    // Search by order_id, email, or name
    if (params.search) {
      query.$or = [
        { order_id: { $regex: params.search, $options: "i" } },
        { "shipping_address.email": { $regex: params.search, $options: "i" } },
        {
          "shipping_address.fullname": { $regex: params.search, $options: "i" },
        },
      ];
    }

    // Cursor-based pagination
    if (cursor) {
      query.$or = query.$or || [];
      query.$or.push(
        { createdAt: { $lt: new Date() } },
        { order_id: { $lt: cursor } }
      );
    }

    let queryBuilder = OrderModel.find(query)
      .sort({ createdAt: -1, order_id: -1 })
      .limit(limit + 1)
      .populate({
        path: "items.product_id",
        model: ProductModel,
        select: "product_id name sku selling_price",
      });

    const result = await queryBuilder.lean().exec();

    let nextCursor: string | null = null;
    if (result.length > limit) {
      const nextItem = result.pop();
      nextCursor = nextItem?.order_id ?? null;
    }

    return {
      data: {
        data: result as unknown as OrderTblType[],
        pagination: {
          nextCursor,
          hasNextPage: !!nextCursor,
        },
        message: "Orders fetched successfully",
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

export const getOrderDetailsService: ServiceFunctionParamType<
  { order_id: string },
  OrderTblType
> = async (params) => {
  const source = "GET ORDER DETAILS SERVICE";
  logger.info("Starting getOrderDetailsService", { body: params });

  try {
    const order = await OrderModel.findOne({
      order_id: params.order_id,
    })
      .populate({
        path: "items.product_id",
        model: ProductModel,
        select: "product_id name sku selling_price images",
      })
      .lean()
      .exec();

    if (!order) {
      throw new CustomError({
        data: null,
        errorMessage: "Order not found",
        source,
        status: StatusCodes.NOT_FOUND,
      });
    }

    return {
      data: {
        data: order as unknown as OrderTblType,
        message: "Order fetched successfully",
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

export const updateOrderFulfillmentService: ServiceFunctionParamType<
  UpdateOrderType,
  UpdateOrderResponse
> = async (params) => {
  const source = "UPDATE ORDER FULFILLMENT SERVICE";
  logger.info("Starting updateOrderFulfillmentService", { body: params });

  try {
    const order = await OrderModel.findOneAndUpdate(
      { order_id: params.order_id },
      { $set: { fulfillment_status: params.fulfillment_status } },
      { new: true }
    )
      .lean()
      .exec();

    if (!order) {
      throw new CustomError({
        data: null,
        errorMessage: "Order not found",
        source,
        status: StatusCodes.NOT_FOUND,
      });
    }

    return {
      data: {
        data: order as unknown as OrderTblType,
        message: "Order fulfillment status updated successfully",
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

export const markBankTransferAsPaidService: ServiceFunctionParamType<
  { order_id: string },
  any
> = async (params) => {
  const source = "MARK BANK TRANSFER AS PAID SERVICE";
  logger.info("Starting markBankTransferAsPaidService", { body: params });

  try {
    const order = await OrderModel.findOneAndUpdate(
      {
        order_id: params.order_id,
        payment_method: PaymentMethod.BANK_TRANSFER,
        payment_status: PaymentStatus.AWAITING_BANK_TRANSFER,
      },
      { $set: { payment_status: PaymentStatus.COMPLETED } },
      { new: true }
    )
      .lean()
      .exec();

    if (!order) {
      throw new CustomError({
        data: null,
        errorMessage: "Order not found or not eligible for payment update",
        source,
        status: StatusCodes.NOT_FOUND,
      });
    }

    return {
      data: {
        data: order,
        message: "Payment status updated successfully",
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

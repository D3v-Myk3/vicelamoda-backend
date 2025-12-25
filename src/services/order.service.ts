import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
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
import { UserModel } from "../models/mongoose/User.model";
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
> = async (params, { user_data }) => {
  console.log(params);
  console.log(user_data);

  const source = "CREATE ORDER SERVICE";
  logger.info("Starting createOrderService", { body: params });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate User
    const user = await UserModel.findOne({
      _id: user_data?._id ?? params.user_id,
    })
      .session(session)
      .exec();
    if (!user) {
      throw new CustomError({
        data: null,
        errorMessage: "User not found. Please log in to place an order.",
        source,
        status: StatusCodes.UNAUTHORIZED,
      });
    }

    let total_amount = 0;
    const orderItems = [];

    // Process each item sequentially to handle stock updates correctly
    for (const item of params.items) {
      const product = await ProductModel.findOne({
        _id: item.product_id,
      })
        .session(session)
        .exec();

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
        // Handle Hierarchical Variant Product
        let matchedSize: any = null;
        let matchedMaterial: any = null;
        let matchedColor: any = null;

        for (const size of product.variants) {
          for (const mat of size.materials) {
            const color = mat.colors.find(
              (c: any) => c.sku === item.variant_sku
            );
            if (color) {
              matchedSize = size;
              matchedMaterial = mat;
              matchedColor = color;
              break;
            }
          }
          if (matchedColor) break;
        }

        if (!matchedColor) {
          throw new CustomError({
            data: null,
            errorMessage: `Color Variant ${item.variant_sku} not found for product ${product.name}`,
            source,
            status: StatusCodes.BAD_REQUEST,
          });
        }

        // Calculate total stock across ALL stores for this specific color variant
        const totalVariantStock = matchedColor.stocks.reduce(
          (sum: number, s: any) => sum + s.stock,
          0
        );

        if (totalVariantStock < item.quantity) {
          throw new CustomError({
            data: null,
            errorMessage: `Insufficient stock for ${matchedSize.size} / ${matchedMaterial.name} / ${matchedColor.name}. Available: ${totalVariantStock}`,
            source,
            status: StatusCodes.BAD_REQUEST,
          });
        }

        // Deduct stock (First Available Strategy)
        let remainingqty = item.quantity;
        for (const storeStock of matchedColor.stocks) {
          if (remainingqty <= 0) break;
          if (storeStock.stock > 0) {
            const deduct = Math.min(storeStock.stock, remainingqty);
            storeStock.stock -= deduct;
            remainingqty -= deduct;
          }
        }

        unit_price = matchedMaterial.price; // Price from Material level
        variant_name = `${product.name}${matchedSize.size ? ` - ${matchedSize.size}` : ""}${matchedMaterial.name ? ` / ${matchedMaterial.name}` : ""}${matchedColor.name ? ` / ${matchedColor.name}` : ""}`;
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

      // Save the product within session
      await product.save({ session });
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

    console.log(orderItems);

    // Create order
    const [order] = await OrderModel.create(
      [
        {
          user_id: params.user_id,
          user: user._id,
          shipping_address: params.shipping_address,
          items: orderItems,
          total_amount,
          payment_method: params.payment_method,
          payment_status,
          fulfillment_status: FulfillmentStatus.PENDING,
        },
      ],
      { session }
    );

    await session.commitTransaction();

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
    await session.abortTransaction();
    logger.error(`Error in createOrderService`, {
      source,
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    }
    return defaultError(source, String(error));
  } finally {
    session.endSession();
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

    if (params.order_id) query._id = params.order_id;
    if (params.user_id) query.user_id = params.user_id;
    if (params.payment_method) query.payment_method = params.payment_method;
    if (params.payment_status) query.payment_status = params.payment_status;
    if (params.fulfillment_status)
      query.fulfillment_status = params.fulfillment_status;

    // Search by order_id, email, or name
    if (params.search) {
      const searchRegex = { $regex: params.search, $options: "i" };
      query.$or = [
        { order_id: searchRegex },
        { "shipping_address.email": searchRegex },
        { "shipping_address.fullname": searchRegex },
      ];
    }

    // Cursor-based pagination logic
    if (cursor) {
      try {
        const decodedCursor = JSON.parse(
          Buffer.from(cursor, "base64").toString("utf-8")
        );
        const { c: cDate, p: pId } = decodedCursor;

        if (cDate && pId) {
          const dateFilter = { createdAt: { $lt: new Date(cDate) } };
          const idFilter = {
            createdAt: new Date(cDate),
            _id: { $lt: pId },
          };

          const paginationOr = [dateFilter, idFilter];

          if (query.$or) {
            query.$and = [{ $or: query.$or }, { $or: paginationOr }];
            delete query.$or;
          } else {
            query.$or = paginationOr;
          }
        }
      } catch (e) {
        logger.warn(`Invalid cursor provided: ${cursor}`, { source });
      }
    }

    let queryBuilder = OrderModel.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate({
        path: "items.product",
        select: "product_id name sku selling_price images",
      })
      .populate({
        path: "user",
        select: "fullname email user_id",
      });

    const result = await queryBuilder.lean().exec();

    let nextCursor: string | null = null;
    if (result.length > limit) {
      const nextItem = result.pop();
      if (nextItem && nextItem.createdAt && nextItem._id) {
        const cursorData = {
          c: new Date(nextItem.createdAt).getTime(),
          p: nextItem._id.toString(),
        };
        nextCursor = Buffer.from(JSON.stringify(cursorData)).toString("base64");
      }
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
        path: "items.product",
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
      { _id: params.order_id },
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

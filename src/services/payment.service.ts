import axios from "axios";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { PAYSTACK_SECRET_KEY } from "../configs/env.configs";
import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { OrderModel, OrderStatus } from "../models/mongoose/Order.model";
import {
  TransactionChannel,
  TransactionModel,
  TransactionStatus,
} from "../models/mongoose/Transaction.model";
import { CustomError, DefaultErrorReturn } from "../types/error.types";
import { ServiceFunctionParamType } from "../types/general.types";

const mapPaystackChannel = (channel: string): TransactionChannel => {
  const c = channel.toLowerCase();
  if (c === "card") return TransactionChannel.CARD;
  if (c === "bank_transfer" || c === "transfer")
    return TransactionChannel.TRANSFER;
  if (c === "ussd") return TransactionChannel.USSD;
  return TransactionChannel.CARD; // Default
};

export const verifyPaymentService: ServiceFunctionParamType<
  { reference: string; order_id: string },
  any
> = async (params) => {
  const source = "VERIFY PAYMENT SERVICE";
  logger.info("Starting verifyPaymentService", { body: params });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Verify with Paystack
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${params.reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const { status, data } = paystackResponse.data;

    if (!status || data.status !== "success") {
      throw new CustomError({
        data: null,
        errorMessage: "Payment verification failed",
        source,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    // 2. Update Transaction
    const transaction = await TransactionModel.findOneAndUpdate(
      { order_id: params.order_id },
      {
        $set: {
          status: TransactionStatus.SUCCESS,
          channel: mapPaystackChannel(data.channel),
          gateway_response: data,
          paid_at: new Date(data.paid_at),
        },
      },
      { new: true, session }
    );

    if (!transaction) {
      throw new CustomError({
        data: null,
        errorMessage: "Transaction record not found",
        source,
        status: StatusCodes.NOT_FOUND,
      });
    }

    // 3. Update Order Status
    const order = await OrderModel.findOneAndUpdate(
      { order_id: params.order_id },
      {
        $set: {
          status: OrderStatus.PAID,
        },
      },
      { new: true, session }
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

    await session.commitTransaction();

    return {
      data: {
        data: order,
        message: "Payment verified and order updated successfully",
      },
      errorMessage: null,
      status: StatusCodes.OK,
      source,
    };
  } catch (error: any) {
    await session.abortTransaction();
    if (axios.isAxiosError(error)) {
      logger.error(`Paystack Error`, {
        source,
        error: error.response?.data || error.message,
      });
      return defaultError(source, "Paystack verification failed");
    }

    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    }
    return defaultError(source, String(error));
  } finally {
    session.endSession();
  }
};

export const paystackWebhookService: ServiceFunctionParamType<
  any,
  any
> = async (payload) => {
  const source = "PAYSTACK WEBHOOK SERVICE";
  logger.info("Processing Paystack Webhook", { event: payload.event });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { event, data } = payload;

    if (event === "charge.success") {
      const reference = data.reference;

      // Update Transaction
      await TransactionModel.findOneAndUpdate(
        { reference },
        {
          $set: {
            status: TransactionStatus.SUCCESS,
            channel: mapPaystackChannel(data.channel),
            gateway_response: data,
            paid_at: new Date(data.paid_at),
          },
        },
        { session }
      );

      // Update Order - Find order by looking up the transaction first to get order_id if not in metadata
      // Or if we store order_id in Paystack metadata (which we should)
      const order_id = data.metadata?.order_id || data.reference; // Fallback to reference if it's the order_id

      await OrderModel.findOneAndUpdate(
        { order_id },
        { $set: { status: OrderStatus.PAID } },
        { session }
      );
    }

    await session.commitTransaction();
    return {
      data: { message: "Webhook processed", data: "" },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: any) {
    await session.abortTransaction();
    logger.error(`Error in Paystack Webhook`, { error: error.message });
    return defaultError(source, "Webhook processing failed");
  } finally {
    session.endSession();
  }
};

import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { logger } from "../configs/logger.configs";
import { PaymentMethod } from "../models/mongoose/Order.model";
import {
  TransactionChannel,
  TransactionGateway,
  TransactionModel,
  TransactionStatus,
} from "../models/mongoose/Transaction.model";
import { CustomError } from "../types/error.types";

export const initiateTransaction = async ({
  order_id,
  amount,
  // email,
  payment_method,
}: {
  order_id: string;
  amount: number;
  email: string;
  payment_method: PaymentMethod;
}) => {
  const source = "INITIATE TRANSACTION";
  logger.info(`Initiating transaction for order: ${order_id}`, {
    payment_method,
  });

  try {
    const reference = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const gateway =
      payment_method === PaymentMethod.CASH_ON_DELIVERY
        ? TransactionGateway.VICELAMODA
        : TransactionGateway.PAYSTACK;
    const channel =
      payment_method === PaymentMethod.CASH_ON_DELIVERY
        ? TransactionChannel.CASH_ON_DELIVERY
        : TransactionChannel.CARD; // Default online to card for now

    const transaction = await TransactionModel.create({
      order_id,
      gateway,
      reference,
      amount,
      currency: "NGN",
      status: TransactionStatus.INITIALIZED,
      channel,
    });

    return transaction;
  } catch (error: any) {
    logger.error(`Error in initiateTransaction`, { error: error.message });
    throw new CustomError({
      data: null,
      errorMessage: "Failed to initiate transaction",
      source,
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export const verifyTransactionService = async (reference: string) => {
  const source = "VERIFY TRANSACTION SERVICE";
  logger.info(`Verifying transaction: ${reference}`);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transaction = await TransactionModel.findOne({ reference }).session(
      session
    );
    if (!transaction) {
      throw new CustomError({
        data: null,
        errorMessage: "Transaction not found",
        source,
        status: StatusCodes.NOT_FOUND,
      });
    }

    if (transaction.status === TransactionStatus.SUCCESS) {
      return transaction;
    }

    // HERE: Integrate with Paystack API if gateway is paystack
    // For now, let's assume we are manually marking success or mocked
    // In a real flow, this would call Paystack verify endpoint

    // transaction.status = TransactionStatus.SUCCESS;
    // transaction.paid_at = new Date();
    // await transaction.save({ session });

    // await OrderModel.findOneAndUpdate(
    //   { order_id: transaction.order_id },
    //   { $set: { status: OrderStatus.PAID } },
    //   { session }
    // );

    await session.commitTransaction();
    return transaction;
  } catch (error: any) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

import mongoose, { Document, Schema } from "mongoose";

export enum TransactionStatus {
  INITIALIZED = "INITIALIZED",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  ABANDONED = "ABANDONED",
  REVERSED = "REVERSED",
}

export enum TransactionGateway {
  PAYSTACK = "PAYSTACK",
  VICELAMODA = "VICELAMODA",
}

export enum TransactionChannel {
  CARD = "CARD",
  TRANSFER = "TRANSFER",
  USSD = "USSD",
  CASH_ON_DELIVERY = "CASH_ON_DELIVERY",
}

export interface ITransaction extends Document {
  transaction_id: string; // special formatted display id
  order_id: string; // reference to Order (as string or ID)
  gateway: TransactionGateway;
  reference: string; // UNIQUE reference from gateway
  amount: number;
  currency: string;
  status: TransactionStatus;
  channel: TransactionChannel;
  gateway_response?: any;
  paid_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    transaction_id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    order_id: {
      type: String,
      required: true,
      index: true,
    },
    gateway: {
      type: String,
      enum: Object.values(TransactionGateway),
      required: true,
      index: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "NGN",
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.INITIALIZED,
      index: true,
    },
    channel: {
      type: String,
      enum: Object.values(TransactionChannel),
      index: true,
    },
    gateway_response: {
      type: Schema.Types.Mixed,
    },
    paid_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "transactions",
  }
);

TransactionSchema.index({ createdAt: -1 });

export const TransactionModel = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);

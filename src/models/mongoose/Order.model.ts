import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./User.model";

export enum PaymentMethod {
  STRIPE = "STRIPE",
  PAYMEO = "PAYMEO",
  CASH_ON_DELIVERY = "CASH_ON_DELIVERY",
  BANK_TRANSFER = "BANK_TRANSFER",
}

export enum PaymentStatus {
  COMPLETED = "COMPLETED",
  PENDING = "PENDING",
  FAILED = "FAILED",
  AWAITING_BANK_TRANSFER = "awaiting_bank_transfer",
}

export enum FulfillmentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export interface IShippingAddress {
  fullname: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface IOrderItem {
  product_id: string;
  variant_sku?: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface IOrder extends Document {
  order_id: string;
  user_id: string;
  user: IUser;
  shipping_address: IShippingAddress;
  items: IOrderItem[];
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  stripe_payment_intent_id?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address_line1: { type: String, required: true },
    address_line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    postal_code: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product_id: { type: String, required: true },
    variant_sku: { type: String },
    variant_name: { type: String },
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    line_total: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    order_id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    shipping_address: {
      type: ShippingAddressSchema,
      required: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    payment_method: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.PAYMEO,
      required: true,
      index: true,
    },
    payment_status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    fulfillment_status: {
      type: String,
      enum: Object.values(FulfillmentStatus),
      default: FulfillmentStatus.PENDING,
      index: true,
    },
    stripe_payment_intent_id: String,
  },
  {
    timestamps: true,
    collection: "orders",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ===================== VIRTUALS ===================== */

/* OrderSchema.virtual("user", {
  ref: "User",
  localField: "user_id",
  foreignField: "user_id",
  justOne: true,
}); */

/* OrderSchema.virtual("store", {
  ref: "Store",
  localField: "store_id",
  foreignField: "store_id",
  justOne: true,
}); */

// OrderSchema.index({ user_id: 1 });
// OrderSchema.index({ payment_method: 1 });
// OrderSchema.index({ payment_status: 1 });
// OrderSchema.index({ fulfillment_status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ "shipping_address.email": 1 });
OrderSchema.index({ "shipping_address.fullname": 1 });

// Composite Indexes
OrderSchema.index({ user_id: 1, createdAt: -1 });
// OrderSchema.index({ store_id: 1, createdAt: -1 });

export const OrderModel = mongoose.model<IOrder>("Order", OrderSchema);

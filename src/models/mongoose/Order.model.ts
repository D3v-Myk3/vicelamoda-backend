import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./User.model";

export enum PaymentMethod {
  ONLINE = "ONLINE",
  CASH_ON_DELIVERY = "CASH_ON_DELIVERY",
}

export enum OrderStatus {
  INITIATED = "INITIATED",
  AWAITING_PAYMENT = "AWAITING_PAYMENT",
  PAID = "PAID",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export interface IShippingAddress {
  fullname: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface IOrderItem {
  product_id: mongoose.Types.ObjectId;
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
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address1: { type: String, required: true },
    address2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip_code: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product_id: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    variant_sku: { type: String },
    variant_name: { type: String },
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    line_total: { type: Number, required: true },
  },
  {
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

OrderItemSchema.virtual("product", {
  ref: "Product",
  localField: "product_id",
  foreignField: "_id",
  justOne: true,
});

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
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.INITIATED,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "orders",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ===================== VIRTUALS ===================== */

OrderSchema.virtual("transactions", {
  ref: "Transaction",
  localField: "order_id",
  foreignField: "order_id",
});

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ "shipping_address.email": 1 });
OrderSchema.index({ "shipping_address.zip_code": 1 });

// Composite Indexes
OrderSchema.index({ user_id: 1, createdAt: -1 });

export const OrderModel = mongoose.model<IOrder>("Order", OrderSchema);

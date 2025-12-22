import {
  FulfillmentStatus,
  IOrder,
  PaymentStatus,
} from "../models/mongoose/Order.model";
import {
  CreateOrderZodType,
  FetchOrdersZodType,
  UpdateOrderFulfillmentZodType,
} from "../schemas/order.zod.schemas";

export type CreateOrderRequest = CreateOrderZodType;

export interface CreateOrderResponse {
  order_id: string;
  total_amount: number;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  createdAt: Date;
}

export type FetchOrdersType = FetchOrdersZodType;

export interface UpdateOrderType
  extends Partial<UpdateOrderFulfillmentZodType> {
  order_id: string;
  payment_status?: PaymentStatus;
}

export interface UpdateOrderResponse {
  order_id: string;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
}

export interface OrderTblType extends IOrder {
  // _id: ObjectId;
}

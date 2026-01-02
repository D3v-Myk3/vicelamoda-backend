import { IOrder, OrderStatus } from "../models/mongoose/Order.model";
import {
  CreateOrderZodType,
  FetchOrdersZodType,
  UpdateOrderStatusZodType,
} from "../schemas/order.zod.schemas";

export type CreateOrderRequest = CreateOrderZodType;

export interface CreateOrderResponse {
  order_id: string;
  total_amount: number;
  status: OrderStatus;
  transaction_reference?: string;
  createdAt: Date;
}

export type FetchOrdersType = FetchOrdersZodType;

export interface UpdateOrderType extends Partial<UpdateOrderStatusZodType> {
  order_id: string;
}

export interface UpdateOrderResponse {
  order_id: string;
  status: OrderStatus;
}

export interface OrderTblType extends IOrder {
  // _id: ObjectId;
}

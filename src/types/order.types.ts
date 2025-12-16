import {
  FulfillmentStatus,
  IOrder,
  PaymentMethod,
  PaymentStatus,
} from "../models/mongoose";

export interface CreateOrderRequest {
  user_id: string;
  shipping_address: {
    fullname: string;
    email: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  items: Array<{
    product_id: string;
    quantity: number;
    variant_sku?: string;
  }>;
  payment_method: PaymentMethod;
  promo_code?: string;
}

export interface CreateOrderResponse {
  order_id: string;
  total_amount: number;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  createdAt: Date;
}

export interface FetchOrdersType {
  order_id?: string;
  user_id?: string;
  payment_method?: PaymentMethod;
  payment_status?: PaymentStatus;
  fulfillment_status?: FulfillmentStatus;
  search?: string; // Search by order_id, email, name
  limit?: number;
  cursor?: string;
}

export interface UpdateOrderType {
  order_id: string;
  payment_status?: PaymentStatus;
  fulfillment_status?: FulfillmentStatus;
}

export interface UpdateOrderResponse {
  order_id: string;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
}

export interface OrderTblType extends IOrder {
  // _id: ObjectId;
}

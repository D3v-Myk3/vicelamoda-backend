import { z } from "zod";
import { OrderStatus, PaymentMethod } from "../models/mongoose/Order.model";

// ✅ Order creation schema
export const createOrderZodSchema = z.strictObject({
  shipping_address: z.strictObject({
    fullname: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
    address1: z.string().min(1, "Address line 1 is required"),
    address2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip_code: z.string().min(1, "Zip code is required"),
    country: z.string().min(1, "Country is required"),
  }),
  items: z
    .array(
      z.strictObject({
        product_id: z.string().min(1, "Product ID is required"),
        quantity: z
          .number()
          .int()
          .positive("Quantity must be a positive integer"),
        variant_sku: z.string().optional(),
      })
    )
    .min(1, "At least one item is required"),
  payment_method: z.nativeEnum(PaymentMethod, {
    message: "Invalid payment method",
  }),
  promo_code: z.string().optional(),
  user_id: z.string().optional(),
});
export type CreateOrderZodType = z.infer<typeof createOrderZodSchema>;

// ✅ Update order status schema
export const updateOrderStatusZodSchema = z.strictObject({
  status: z.nativeEnum(OrderStatus, {
    message: "Invalid order status",
  }),
});
export type UpdateOrderStatusZodType = z.infer<
  typeof updateOrderStatusZodSchema
>;

// ✅ Fetch orders query schema
export const fetchOrdersZodSchema = z.strictObject({
  order_id: z.string().optional(),
  user_id: z.string().optional(),
  payment_method: z.nativeEnum(PaymentMethod).optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
  cursor: z.string().optional(),
});
export type FetchOrdersZodType = z.infer<typeof fetchOrdersZodSchema>;

// ✅ Order ID param schema
export const orderIdParamZodSchema = z.strictObject({
  order_id: z.string().min(1, "Order ID is required"),
});
export type OrderIdParamZodType = z.infer<typeof orderIdParamZodSchema>;

import { Router } from "express";
import {
  createOrderController,
  fetchOrdersController,
  getOrderDetailsController,
  markBankTransferAsPaidController,
  updateOrderFulfillmentController,
} from "../controllers/order.controller";
import { Zod_ValidationMiddleware } from "../middlewares/validations/zod.validation.middleware";
import {
  createOrderZodSchema,
  fetchOrdersZodSchema,
  orderIdParamZodSchema,
  updateOrderFulfillmentZodSchema,
} from "../schemas/order.zod.schemas";

/* ================= USER ORDER ROUTES ================= */
export const orderRoutes = Router();

orderRoutes.post(
  "/",
  Zod_ValidationMiddleware({
    schema: createOrderZodSchema,
    source: "Create Order",
  }),
  createOrderController
);
orderRoutes.get(
  "/",
  Zod_ValidationMiddleware({
    schema: fetchOrdersZodSchema,
    source: "Fetch Orders",
    path: "query",
  }),
  fetchOrdersController
);
orderRoutes.get(
  "/:order_id",
  Zod_ValidationMiddleware({
    schema: orderIdParamZodSchema,
    source: "Get Order Details",
    path: "params",
  }),
  getOrderDetailsController
);

/* ================= ADMIN ORDER ROUTES ================= */
export const adminOrderRoutes = Router();

adminOrderRoutes.patch(
  "/:order_id/fulfillment",
  // adminAuthMiddleware,
  Zod_ValidationMiddleware({
    schema: orderIdParamZodSchema,
    source: "Update Order Fulfillment (Params)",
    path: "params",
  }),
  Zod_ValidationMiddleware({
    schema: updateOrderFulfillmentZodSchema,
    source: "Update Order Fulfillment (Body)",
  }),
  updateOrderFulfillmentController
);

adminOrderRoutes.patch(
  "/:order_id/mark-paid",
  // adminAuthMiddleware,
  Zod_ValidationMiddleware({
    schema: orderIdParamZodSchema,
    source: "Mark Bank Transfer as Paid (Params)",
    path: "params",
  }),
  markBankTransferAsPaidController
);

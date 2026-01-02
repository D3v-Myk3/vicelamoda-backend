import { Router } from "express";
import {
  createOrderController,
  fetchOrdersController,
  getOrderDetailsController,
  markBankTransferAsPaidController,
  updateOrderStatusController,
} from "../../controllers/order.controller";
import { Zod_ValidationMiddleware } from "../../middlewares/validations/zod.validation.middleware";
import {
  createOrderZodSchema,
  fetchOrdersZodSchema,
  orderIdParamZodSchema,
  updateOrderStatusZodSchema,
} from "../../schemas/order.zod.schemas";

const router = Router();

// User routes
router.post(
  "/",
  Zod_ValidationMiddleware({
    schema: createOrderZodSchema,
    source: "Create Order",
  }),
  createOrderController
);
router.get(
  "/",
  Zod_ValidationMiddleware({
    schema: fetchOrdersZodSchema,
    source: "Fetch Orders",
    path: "query",
  }),
  fetchOrdersController
);
router.get(
  "/:order_id",
  Zod_ValidationMiddleware({
    schema: orderIdParamZodSchema,
    source: "Get Order Details",
    path: "params",
  }),
  getOrderDetailsController
);

// Admin routes
router.patch(
  "/:order_id/fulfillment",
  Zod_ValidationMiddleware({
    schema: orderIdParamZodSchema,
    source: "Update Order Fulfillment (Params)",
    path: "params",
  }),
  Zod_ValidationMiddleware({
    schema: updateOrderStatusZodSchema,
    source: "Update Order Fulfillment (Body)",
  }),
  updateOrderStatusController
);
router.patch(
  "/:order_id/mark-paid",
  Zod_ValidationMiddleware({
    schema: orderIdParamZodSchema,
    source: "Mark Bank Transfer as Paid (Params)",
    path: "params",
  }),
  markBankTransferAsPaidController
);

export default router;

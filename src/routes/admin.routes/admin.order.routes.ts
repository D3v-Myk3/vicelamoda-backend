import { Router } from "express";
import {
  createOrderController,
  fetchOrdersController,
  getOrderDetailsController,
  updateOrderFulfillmentController,
  markBankTransferAsPaidController,
} from "../../controllers/order.controller";

const router = Router();

// User routes
router.post("/", createOrderController);
router.get("/", fetchOrdersController);
router.get("/:order_id", getOrderDetailsController);

// Admin routes
router.patch("/:order_id/fulfillment", updateOrderFulfillmentController);
router.patch("/:order_id/mark-paid", markBankTransferAsPaidController);

export default router;

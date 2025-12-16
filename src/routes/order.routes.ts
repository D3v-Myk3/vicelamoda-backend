import { Router } from "express";
import {
  createOrderController,
  fetchOrdersController,
  getOrderDetailsController,
} from "../controllers/order.controller";
import { userAuthMiddleware } from "../middlewares/auth/user.auth";

const router = Router();

// User routes
router.post("/", userAuthMiddleware, createOrderController);
router.get("/", userAuthMiddleware, fetchOrdersController);
router.get("/:order_id", userAuthMiddleware, getOrderDetailsController);

/* // Admin routes
router.patch(
  "/:order_id/fulfillment",
  adminAuthMiddleware,
  updateOrderFulfillmentController
);
router.patch(
  "/:order_id/mark-paid",
  adminAuthMiddleware,
  markBankTransferAsPaidController
);
 */
export default router;

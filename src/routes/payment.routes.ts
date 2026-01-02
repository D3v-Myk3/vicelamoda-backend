import { Router } from "express";
import { verifyPaymentController } from "../controllers/payment.controller";

const paymentRoutes = Router();

paymentRoutes.post("/verify", verifyPaymentController);

export default paymentRoutes;

import { Router } from "express";
import { globalSearchController } from "../controllers/search.controller";
import { adminAuthMiddleware } from "../middlewares/auth/admin.auth";

const router = Router();

// Global search (admin only for now, can be made public if needed)
router.get("/", adminAuthMiddleware, globalSearchController);

export default router;

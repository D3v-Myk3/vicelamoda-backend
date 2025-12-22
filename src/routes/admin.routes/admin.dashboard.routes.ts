import { Router } from "express";
import { getDashboardStatsController } from "../../controllers/admin.dashboard.controller";

const adminDashboardRoutes = Router();

adminDashboardRoutes.get("/stats", getDashboardStatsController);

export default adminDashboardRoutes;

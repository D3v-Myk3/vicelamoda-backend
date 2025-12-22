import express from "express";
import { header } from "express-validator";
import { handleValidationErrors } from "../../helpers/error.helpers";
import { adminAuthMiddleware } from "../../middlewares/auth/admin.auth";
import adminBrandRoutes from "./admin.brand.routes";
import adminCategoryRoutes from "./admin.category.routes";
import adminProductRoutes from "./admin.product.routes";
// import adminSalesRoutes from "./admin.sales.routes";
import adminDashboardRoutes from "./admin.dashboard.routes";
import adminStoreRoutes from "./admin.store.routes";
import adminSupplyRoutes from "./admin.supply.routes";
import adminOrderRoutes from "./admin.order.routes";

const adminRoutes = express.Router();

adminRoutes.use(
  header("x-vcl-ad-auth-token")
    .trim()
    .notEmpty()
    .withMessage("Admin Authorization Token is Required")
    .isString()
    .withMessage("Admin Authorization Token must be a string"),
  /* .matches(/^SFX_Bearer_.+/)
    .withMessage("Invalid Token Format") */
  handleValidationErrors,
  adminAuthMiddleware
);

// adminRoutes.use("/sales", adminSalesRoutes);
adminRoutes.use("/brands", adminBrandRoutes);
adminRoutes.use("/stores", adminStoreRoutes);
adminRoutes.use("/supplies", adminSupplyRoutes);
adminRoutes.use("/products", adminProductRoutes);
adminRoutes.use("/categories", adminCategoryRoutes);
adminRoutes.use("/dashboard", adminDashboardRoutes);
adminRoutes.use("/orders", adminOrderRoutes);

export default adminRoutes;

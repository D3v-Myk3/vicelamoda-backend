import express from "express";
import { header } from "express-validator";
import { handleValidationErrors } from "../../helpers/error.helpers";
// import adminSalesRoutes from "./admin.sales.routes";
import { userAuthMiddleware } from "../../middlewares/auth/user.auth";
import brandRoutes from "../brand.routes";
import categoryRoutes from "../category.routes";
import orderRoutes from "../order.routes";
import searchRoutes from "../search.routes";
import wishlistRoutes from "../wishlist.routes";
import userProfileRoutes from "./user.profile.routes";

const userRoutes = express.Router();

userRoutes.use(
  header("x-vcl-auth-token")
    .trim()
    .notEmpty()
    .withMessage("User Authorization Token is Required")
    .isString()
    .withMessage("User Authorization Token must be a string"),
  /* .matches(/^SFX_Bearer_.+/)
    .withMessage("Invalid Token Format") */
  handleValidationErrors,
  userAuthMiddleware
);

// userRoutes.use("/products", productRoutes);
userRoutes.use("/categories", categoryRoutes);
userRoutes.use("/brands", brandRoutes);
userRoutes.use("/orders", orderRoutes);
userRoutes.use("/profile", userProfileRoutes);
userRoutes.use("/search", searchRoutes);
userRoutes.use("/wishlist", wishlistRoutes);

export default userRoutes;

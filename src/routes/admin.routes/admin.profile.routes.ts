import express from "express";
import {
  updateAdminProfileController,
  updatePasswordController,
} from "../../controllers/profile.controller";
import { Zod_ValidationMiddleware } from "../../middlewares/validations/zod.validation.middleware";
import {
  updatePasswordZodSchema,
  updateUserProfileZodSchema,
} from "../../schemas/user.zod.schemas";

const adminProfileRoutes = express.Router();

adminProfileRoutes.put(
  "/update",
  Zod_ValidationMiddleware({
    schema: updateUserProfileZodSchema,
    source: "Update admin profile",
  }),
  updateAdminProfileController
);

adminProfileRoutes.put(
  "/update-password",
  Zod_ValidationMiddleware({
    schema: updatePasswordZodSchema,
    source: "Update password",
  }),
  updatePasswordController
);

export default adminProfileRoutes;

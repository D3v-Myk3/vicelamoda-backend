import express from "express";
import { updateUserProfileController } from "../../controllers/user.controller";
import { Zod_ValidationMiddleware } from "../../middlewares/validations/zod.validation.middleware";
import { updateUserProfileZodSchema } from "../../schemas/user.zod.schemas";

const userProfileRoutes = express.Router();

userProfileRoutes.put(
  "/update",
  Zod_ValidationMiddleware({
    schema: updateUserProfileZodSchema,
    source: "Update user profile",
    // path: "body.user_data",
    // shouldParse: true,
  }),
  updateUserProfileController
);

export default userProfileRoutes;

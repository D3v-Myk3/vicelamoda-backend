import express from "express";
import {
  userLoginController,
  userRegistrationController,
} from "../../controllers/access.controller";
import { Zod_ValidationMiddleware } from "../../middlewares/validations/zod.validation.middleware";
import {
  userLoginZodSchema,
  userRegistrationZodSchema,
} from "../../schemas/access.zod.schemas";

const userAccessRoutes = express.Router();

userAccessRoutes.post(
  "/signup",
  Zod_ValidationMiddleware({
    schema: userRegistrationZodSchema,
    source: "User registration",
  }),
  userRegistrationController
);

userAccessRoutes.post(
  "/login",
  Zod_ValidationMiddleware({
    schema: userLoginZodSchema,
    source: "User login",
  }),
  userLoginController
);

export default userAccessRoutes;

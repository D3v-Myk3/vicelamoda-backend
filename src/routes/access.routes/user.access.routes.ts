import express from "express";
import {
  userLoginController,
  userRegistrationController,
} from "../../controllers/access.controller";
import { firebaseAuthController } from "../../controllers/firebase-auth.controller";
import { Zod_ValidationMiddleware } from "../../middlewares/validations/zod.validation.middleware";
import {
  firebaseAuthZodSchema,
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

userAccessRoutes.post(
  "/firebase-auth",
  Zod_ValidationMiddleware({
    schema: firebaseAuthZodSchema,
    source: "Firebase Auth",
  }),
  firebaseAuthController
);

export default userAccessRoutes;

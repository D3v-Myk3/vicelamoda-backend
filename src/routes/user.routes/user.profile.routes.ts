import express from "express";
import { updateProfileController } from "../../controllers/user.controller";
// import { Zod_ValidationMiddleware } from "../../middlewares/validations/zod.validation.middleware";
// We can add Zod validation later if needed, for now trusting simple body

const userProfileRoutes = express.Router();

userProfileRoutes.put("/update", updateProfileController);

export default userProfileRoutes;

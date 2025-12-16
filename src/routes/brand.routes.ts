import express from "express";
import { brandSearchValidation } from "../middlewares/validations/brand.validation.middleware";
import { paginationValidation } from "../middlewares/validations/pagination.validation.middleware";
import { fetchPublicBrandsController } from "../controllers/public/brand.public.controller";

const brandRoutes = express.Router();

// Public route - no authentication required
brandRoutes.get(
  "/",
  paginationValidation,
  brandSearchValidation,
  fetchPublicBrandsController
);

export default brandRoutes;

import express from "express";
import { categorySearchValidation } from "../middlewares/validations/category.validation.middleware";
import { paginationValidation } from "../middlewares/validations/pagination.validation.middleware";
import { fetchPublicCategoriesController } from "../controllers/public/category.public.controller";

const categoryRoutes = express.Router();

// Public route - no authentication required
categoryRoutes.get(
  "/",
  paginationValidation,
  categorySearchValidation,
  fetchPublicCategoriesController
);

export default categoryRoutes;

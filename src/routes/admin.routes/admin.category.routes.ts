import express from "express";
import {
  createCategoryController,
  deleteCategoryController,
  fetchCategoriesController,
  fetchSingleCategoryController,
  updateCategoryController,
} from "../../controllers/category.controller";

import { categorySearchValidation } from "../../middlewares/validations/category.validation.middleware";
import { paginationValidation } from "../../middlewares/validations/pagination.validation.middleware";
import { Zod_ValidationMiddleware } from "../../middlewares/validations/zod.validation.middleware";
import {
  createCategoryZodSchema,
  updateCategoryZodSchema,
} from "../../schemas/category.zod.schemas";

const adminCategoryRoutes = express.Router();

adminCategoryRoutes.post(
  "/",
  Zod_ValidationMiddleware({
    schema: createCategoryZodSchema,
    source: "Category creation",
    path: "body",
  }),
  createCategoryController
);
adminCategoryRoutes.get(
  "/",
  paginationValidation,
  categorySearchValidation,
  fetchCategoriesController
);
adminCategoryRoutes.get("/:category_id", fetchSingleCategoryController);
adminCategoryRoutes.put(
  "/:category_id",
  Zod_ValidationMiddleware({
    schema: updateCategoryZodSchema,
    source: "Category update",
    path: "body",
  }),
  updateCategoryController
);
adminCategoryRoutes.delete("/:category_id", deleteCategoryController);

export default adminCategoryRoutes;

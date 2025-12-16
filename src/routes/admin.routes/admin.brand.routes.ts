import express from "express";
import {
  createBrandController,
  deleteBrandController,
  fetchBrandsController,
  fetchSingleBrandController,
  updateBrandController,
} from "../../controllers/brand.controller";

import { brandSearchValidation } from "../../middlewares/validations/brand.validation.middleware";
import { paginationValidation } from "../../middlewares/validations/pagination.validation.middleware";
import { Zod_ValidationMiddleware } from "../../middlewares/validations/zod.validation.middleware";
import {
  createBrandZodSchema,
  updateBrandZodSchema,
} from "../../schemas/brand.zod.schemas";

const adminBrandRoutes = express.Router();

adminBrandRoutes.post(
  "/",
  Zod_ValidationMiddleware({
    schema: createBrandZodSchema,
    source: "Brand creation",
    path: "body",
  }),
  createBrandController
);
adminBrandRoutes.get(
  "/",
  paginationValidation,
  brandSearchValidation,
  fetchBrandsController
);
adminBrandRoutes.get("/:brand_id", fetchSingleBrandController);
adminBrandRoutes.put(
  "/:brand_id",
  Zod_ValidationMiddleware({
    schema: updateBrandZodSchema,
    source: "Brand update",
    path: "body",
  }),
  updateBrandController
);
adminBrandRoutes.delete("/:brand_id", deleteBrandController);

export default adminBrandRoutes;

import { Router } from "express";
import {
  createSupplyController,
  fetchSingleSupplyController,
  fetchSuppliesController,
} from "../../controllers/supply.controller";

import { paginationValidation } from "../../middlewares/validations/pagination.validation.middleware";
import { supplySearchValidation } from "../../middlewares/validations/supply.validation.middleware";
import { Zod_ValidationMiddleware } from "../../middlewares/validations/zod.validation.middleware";
import { createSupplyZodSchema } from "../../schemas/supply.zod.schemas";

const adminSupplyRoutes = Router();

adminSupplyRoutes.post(
  "/",
  Zod_ValidationMiddleware({
    schema: createSupplyZodSchema,
    source: "Supply creation",
    path: "body",
  }),
  createSupplyController
);
adminSupplyRoutes.get(
  "/",
  paginationValidation,
  supplySearchValidation,
  fetchSuppliesController
);
adminSupplyRoutes.get("/:supply_id", fetchSingleSupplyController);

export default adminSupplyRoutes;

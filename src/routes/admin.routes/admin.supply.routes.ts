import { Router } from "express";
import {
  createSupplyController,
  deleteSupplyController,
  fetchSingleSupplyController,
  fetchSuppliesController,
  updateSupplyController,
} from "../../controllers/supply.controller";

import { paginationValidation } from "../../middlewares/validations/pagination.validation.middleware";
import { supplySearchValidation } from "../../middlewares/validations/supply.validation.middleware";
import { Zod_ValidationMiddleware } from "../../middlewares/validations/zod.validation.middleware";
import {
  createSupplyZodSchema,
  updateSupplyZodSchema,
} from "../../schemas/supply.zod.schemas";

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

adminSupplyRoutes.put(
  "/:supply_id",
  Zod_ValidationMiddleware({
    schema: updateSupplyZodSchema,
    source: "Supply update",
    path: "body",
  }),
  updateSupplyController
);

adminSupplyRoutes.delete("/:supply_id", deleteSupplyController);

export default adminSupplyRoutes;

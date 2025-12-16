import { Router } from "express";
import {
  createStoreController,
  deleteStoreController,
  fetchSingleStoreController,
  fetchStoresController,
  updateStoreController,
} from "../../controllers/store.controller";
import { Zod_ValidationMiddleware } from "../../middlewares/validations/zod.validation.middleware";
import {
  createStoreZodSchema,
  updateStoreZodSchema,
} from "../../schemas/store.zod.schemas";

const adminStoreRoutes = Router();

adminStoreRoutes.post(
  "/",
  Zod_ValidationMiddleware({
    schema: createStoreZodSchema,
    source: "Store creation",
    path: "body",
  }),
  createStoreController
);

adminStoreRoutes.get("/", fetchStoresController);

adminStoreRoutes.get("/:store_id", fetchSingleStoreController);

adminStoreRoutes.patch(
  "/:store_id",
  Zod_ValidationMiddleware({
    schema: updateStoreZodSchema,
    source: "Store update",
    path: "body",
  }),
  updateStoreController
);

adminStoreRoutes.delete("/:store_id", deleteStoreController);

export default adminStoreRoutes;

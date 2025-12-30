import express from "express";
import {
  createProductController,
  deleteProductController,
  fetchProductsController,
  fetchSingleProductController,
  updateProductController,
} from "../../controllers/product.controller";
import {
  handleUploadErrors,
  uploadProductImages,
} from "../../middlewares/multer.middlewares";
import { paginationValidation } from "../../middlewares/validations/pagination.validation.middleware";
import { productSearchValidation } from "../../middlewares/validations/product.validation.middleware";
import { Zod_ValidationMiddleware } from "../../middlewares/validations/zod.validation.middleware";
import {
  createProductZodSchema,
  updateProductZodSchema,
} from "../../schemas/product.zod.schemas";

const adminProductRoutes = express.Router();

adminProductRoutes.get(
  "/",
  paginationValidation,
  productSearchValidation,
  fetchProductsController
);
adminProductRoutes.get("/:product_id", fetchSingleProductController);
adminProductRoutes.post(
  "",
  handleUploadErrors(uploadProductImages),
  Zod_ValidationMiddleware({
    schema: createProductZodSchema,
    source: "Product creation",
    path: "body.product_data",
    shouldParse: true,
  }),
  createProductController
);

adminProductRoutes.put(
  "/:product_id",
  handleUploadErrors(uploadProductImages),
  Zod_ValidationMiddleware({
    schema: updateProductZodSchema,
    source: "Product update",
    path: "body.product_data",
    shouldParse: true,
  }),
  updateProductController
);

adminProductRoutes.delete("/:product_id", deleteProductController);

export default adminProductRoutes;

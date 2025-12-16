import express from "express";
import {
  createProductController,
  updateProductController,
} from "../../controllers/product.controller";
import {
  handleUploadErrors,
  uploadProductImages,
} from "../../middlewares/multer.middlewares";
import { Zod_ValidationMiddleware } from "../../middlewares/validations/zod.validation.middleware";
import {
  createProductZodSchema,
  updateProductZodSchema,
} from "../../schemas/product.zod.schemas";

const adminProductRoutes = express.Router();

/* adminProductRoutes.get("/", fetchProductsController);
adminProductRoutes.get("/:product_id", fetchSingleProductController); */
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

export default adminProductRoutes;

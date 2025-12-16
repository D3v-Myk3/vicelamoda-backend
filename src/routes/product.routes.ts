import express from "express";
import {
  fetchProductByBarcodeController,
  fetchProductsController,
  fetchSingleProductController,
} from "../controllers/product.controller";
import { paginationValidation } from "../middlewares/validations/pagination.validation.middleware";
import { productSearchValidation } from "../middlewares/validations/product.validation.middleware";

const productRoutes = express.Router();

productRoutes.get(
  "/",
  paginationValidation,
  productSearchValidation,
  fetchProductsController
);

productRoutes.get("/barcode/:code", fetchProductByBarcodeController);
productRoutes.get("/:product_id", fetchSingleProductController);

/* productRoutes.post(
  "",
  // uploadProductImages,
  handleUploadErrors(uploadProductImages),
  Zod_ValidationMiddleware({
    schema: createProductZodSchema,
    source: "Product creation",
    path: "body.product_data",
    shouldParse: true,
  }),
  createProductController
); */

export default productRoutes;

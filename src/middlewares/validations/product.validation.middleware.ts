import { NextFunction, Request, Response } from "express";
import { query, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { allowedProductSizeVariation } from "../../types/product.type";

export const productSearchValidation = [
  // Text search fields
  query("search").optional().isString().withMessage("Search must be a string"),
  query("name").optional().isString().withMessage("Name must be a string"),
  query("sku").optional().isString().withMessage("SKU must be a string"),
  query("product_id")
    .optional()
    .isString()
    .withMessage("Product ID must be a string"),
  query("category_id")
    .optional()
    .isString()
    .withMessage("Category ID must be a string"),
  query("brand_id")
    .optional()
    .isString()
    .withMessage("Brand ID must be a string"),

  // Enum fields
  query("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either 'active' or 'inactive'"),
  query("size")
    .optional()
    .isIn(allowedProductSizeVariation)
    .withMessage(
      `Size must be one of: ${allowedProductSizeVariation.join(", ")}`
    ),

  // Range filters with custom validator
  query("min_quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Minimum quantity must be a non-negative integer")
    .toInt(),
  query("max_quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Maximum quantity must be a non-negative integer")
    .toInt()
    .custom((value, { req }) => {
      if (req.query?.min_quantity && value < Number(req.query?.min_quantity)) {
        throw new Error(
          "Maximum quantity must be greater than or equal to minimum quantity"
        );
      }
      return true;
    }),

  query("min_price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be a non-negative number")
    .toFloat(),
  query("max_price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a non-negative number")
    .toFloat()
    .custom((value, { req }) => {
      if (req.query?.min_price && value < Number(req.query?.min_price)) {
        throw new Error(
          "Maximum price must be greater than or equal to minimum price"
        );
      }
      return true;
    }),

  // Validation result handler
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        data: null,
        errorMessage: errors.array()[0].msg,
        status: StatusCodes.BAD_REQUEST,
        source: "Product Search Validation",
      });
    }
    next();
  },
];

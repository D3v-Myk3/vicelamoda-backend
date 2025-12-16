import { NextFunction, Request, Response } from "express";
import { query, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";

export const brandSearchValidation = [
  // Text search fields
  query("search").optional().isString().withMessage("Search must be a string"),
  query("brand_id")
    .optional()
    .isString()
    .withMessage("Brand ID must be a string"),
  query("name").optional().isString().withMessage("Name must be a string"),
  query("abbreviation")
    .optional()
    .isString()
    .withMessage("Abbreviation must be a string"),

  // Validation result handler
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        data: null,
        errorMessage: errors.array()[0].msg,
        status: StatusCodes.BAD_REQUEST,
        source: "Brand Search Validation",
      });
    }
    next();
  },
];

import { NextFunction, Request, Response } from "express";
import { query, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";

export const supplySearchValidation = [
  // Text search fields
  query("search").optional().isString().withMessage("Search must be a string"),
  query("supply_id")
    .optional()
    .isString()
    .withMessage("Supply ID must be a string"),
  query("supplier_name")
    .optional()
    .isString()
    .withMessage("Supplier name must be a string"),
  query("supplier_contact")
    .optional()
    .isString()
    .withMessage("Supplier contact must be a string"),
  query("store_id")
    .optional()
    .isString()
    .withMessage("Store ID must be a string"),
  query("recorded_by")
    .optional()
    .isString()
    .withMessage("Recorded by must be a string"),

  // Date filters
  query("start_date")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date")
    .toDate(),
  query("end_date")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date")
    .toDate()
    .custom((value, { req }) => {
      if (
        req.query?.start_date &&
        value < new Date(req.query.start_date as string)
      ) {
        throw new Error("End date must be greater than or equal to start date");
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
        source: "Supply Search Validation",
      });
    }
    next();
  },
];

import { NextFunction, Request, Response } from "express";
import { query, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { paginationConfig } from "../../configs/pagination.config";

export const paginationValidation = [
  query("cursor").optional().isString().withMessage("Cursor must be a string"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: paginationConfig.maxLimit })
    .withMessage(
      `Limit must be an integer between 1 and ${paginationConfig.maxLimit}`
    )
    .toInt(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        data: null,
        errorMessage: errors.array()[0].msg,
        status: StatusCodes.BAD_REQUEST,
        source: "Pagination Validation",
      });
    }
    next();
  },
];

import { NextFunction, Request } from "express";
import { validationResult } from "express-validator";
import { ZodError } from "zod";
import { greenAnsiColor, logger } from "../configs/logger.configs";
import {
  CustomError,
  DefaultErrorReturn,
  ErrorHandlerReturn,
  ErrorProps,
} from "../types/error.types";
import {
  CustomRequest,
  CustomResponse,
  DefaultErrorReturnObj,
} from "../types/general.types";
import { colorizeStatus } from "./string_manipulation.helpers";

export const handleErrors = <T>({
  response,
  res,
  error,
  source,
  status,
}: Partial<ErrorProps<T>>): ErrorHandlerReturn => {
  // console.log(response || error);
  const result = error instanceof CustomError ? error : response!;

  if (!res)
    return !error
      ? (result as DefaultErrorReturnObj<null>)
      : error instanceof CustomError
        ? error
        : {
            data: null,
            errorMessage: error.message,
            source: source as string,
            status: 500,
          };

  let selStatus = !error
    ? (result?.status as number)
    : error instanceof CustomError
      ? error.status
      : status;

  if (typeof selStatus !== "number") selStatus = 500;

  if (selStatus < 500) {
    logger.info(
      `Error occurred in ${greenAnsiColor(
        source ? source : result?.source
      )} with status code ${colorizeStatus(selStatus)} and message: ${greenAnsiColor(
        error?.message || result?.errorMessage
      )}`,
      { stack: error?.stack, source, status: selStatus }
    );

    res.status(selStatus).json({
      data: null,
      message: result
        ? (result.errorMessage as string)
        : error?.message
          ? error?.message
          : "An unknown error occurred",
    });

    return;
  }

  logger.error(
    `Error occurred in ${greenAnsiColor(
      source ? source : result?.source
    )} with status code ${colorizeStatus(
      selStatus
    )} and message: ${greenAnsiColor(error?.message || result?.errorMessage)}`,
    { stack: error?.stack, source, status: selStatus }
  );

  /* console.log(error?.stack);

  console.log(result || error);

  console.log(selStatus); */

  res
    .status(selStatus as number)
    .json({ data: null, message: "An internal server error occurred" });
  return;
};

export const defaultError = (
  source: string,
  error: string
): DefaultErrorReturn => {
  return {
    data: null,
    errorMessage: error ? error : "An unknown error occurred",
    source: source,
    status: 500,
  };
};

export const handleValidationErrors = (
  req: CustomRequest,
  res: CustomResponse,
  next: NextFunction
) => {
  const errors = validationResult(req as Request);

  if (!errors.isEmpty()) {
    logger.error(errors.array()[0].msg);

    return res.status(400).json({ data: null, message: errors.array()[0].msg });
  }

  next();
};

/* // 🛠️ Helper for error responses
export const handleZodValidationError = (
  res: CustomResponse,
  context: string,
  errorMessage: string
) => {
  logger.error(`${context} validation failed ~ Error: ${errorMessage}`, {
    error: errorMessage
  });
  res.status(400).json({
    data: null,
    message: errorMessage.replace(/"|_/g, "")
  });
}; */

// 🛠️ Enhanced Helper for Zod Validation Errors
export const handleZodValidationError = (
  res: CustomResponse,
  context: string,
  error: ZodError
): void => {
  let message = "Validation failed.";

  if (error instanceof ZodError && error.issues.length > 0) {
    const issue = error.issues[0]; // ✅ Only first issue
    const path = issue.path?.length ? issue.path.join(".") : "root";

    // Default placeholders
    let expected = "";
    let received = "";
    const extra = issue.message ? issue.message : "";

    // ✅ Handle expected/received if present
    if (issue.code === "invalid_type") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalidTypeIssue = issue as any;
      expected = invalidTypeIssue.expected
        ? `Expected: ${invalidTypeIssue.expected}. `
        : "";
      received = invalidTypeIssue.received
        ? `Received: ${invalidTypeIssue.received}. `
        : "";

      // ✅ Special case: required field
      if (issue.message.includes("required")) {
        message = `${capitalize(path)} is required. ${expected}`.trim();
        // 🛑 Stop further processing for this error
        res.status(400).json({
          data: null,
          message,
        });

        return;
      }
    }

    // ✅ Handle all other issue types
    switch (issue.code) {
      case "invalid_type":
        message = `${capitalize(path)} has an invalid type. ${expected}${received}${extra}`;
        break;
      case "invalid_format":
        message = `${capitalize(path)} has an invalid format. ${extra}`;
        break;
      case "too_small":
        message = `${capitalize(path)} is too small. ${extra}`;
        break;
      case "too_big":
        message = `${capitalize(path)} is too large. ${extra}`;
        break;
      case "unrecognized_keys":
        message = `Unrecognized field(s): ${issue.keys?.join(", ")}.`;
        break;
      case "invalid_union":
        message = `${capitalize(path)} does not match any allowed type. ${extra}`;
        break;
      case "custom":
        message = `${capitalize(path)}: ${extra}`;
        break;
      case "invalid_value":
        message = `${capitalize(path)} has an invalid value. ${extra}`;
        break;
      case "invalid_key":
        message = `Invalid key "${path}". ${extra}`;
        break;
      case "invalid_element":
        message = `${capitalize(path)} contains an invalid element. ${extra}`;
        break;
      case "not_multiple_of":
        message = `${capitalize(path)} must be a multiple of a specific number. ${extra}`;
        break;
      default:
        message = `${capitalize(path)}: Invalid input. ${extra}`;
        break;
    }

    message = message.replace(/\s+/g, " ").trim();
  }

  logger.error(`${context} validation failed: ${message}`, {
    context,
    error: error instanceof ZodError ? error.issues : error,
  });

  res.status(400).json({
    data: null,
    message,
  });
  return;
};

// Helper
const capitalize = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

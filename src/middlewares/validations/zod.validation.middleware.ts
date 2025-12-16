import { NextFunction } from "express";
import { ZodError, ZodObject } from "zod";
import { logger } from "../../configs/logger.configs";
import { handleZodValidationError } from "../../helpers/error.helpers";
import { CustomRequest, CustomResponse } from "../../types/general.types";

export const Zod_ValidationMiddleware =
  ({
    schema,
    source,
    path = "body",
    shouldParse = false,
  }: {
    schema: ZodObject;
    source: string;
    path?: string;
    shouldParse?: boolean;
  }) =>
  async (
    req: CustomRequest,
    res: CustomResponse,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.verbose(`Validating ${source} with Zod`, { path });

      // Resolve nested request path (e.g., "body.schoolData.details")
      const sections = path.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let target: any = req;
      for (const section of sections) {
        target = target?.[section];
        if (target === undefined) break;
      }

      if (target === undefined) {
        res.status(400).json({
          message: `Invalid validation path: '${path}'`,
          data: null,
        });
        return;
      }

      console.log("Logging Request Body");
      console.log(req.body);

      if (shouldParse) target = JSON.parse(target);

      console.log(target);

      // Validate data using Zod
      const parsed = schema.safeParse(target);
      if (!parsed.success) {
        return handleZodValidationError(res, "Create booking", parsed.error);
      }

      // Optionally overwrite with validated data
      /* if (shouldParse) {
        let obj: any = req;
        for (let i = 0; i < sections.length - 1; i++) {
          obj = obj[sections[i]];
        }
        obj[sections[sections.length - 1]] = parsed;
      } */

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issue = error.issues[0];
        res.status(400).json({
          message: `${issue.path.join(".")} - ${issue.message}`,
          data: null,
        });
      } else {
        res.status(500).json({
          message: "Internal validation error",
          data: (error as Error).message,
        });
      }
    }
  };

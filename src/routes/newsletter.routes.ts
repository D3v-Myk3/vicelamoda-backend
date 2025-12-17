import { Router } from "express";
import { subscribeToNewsletterController } from "../controllers/newsletter.controller";
import { Zod_ValidationMiddleware } from "../middlewares/validations/zod.validation.middleware";
import { subscribeToNewsletterZodSchema } from "../schemas/newsletter.zod.schemas";

const newsLetterRouter = Router();

newsLetterRouter.post(
  "/subscribe",
  Zod_ValidationMiddleware({
    schema: subscribeToNewsletterZodSchema,
    source: "body",
  }),
  // processRequestBody(subscribeToNewsletterZodSchema),
  subscribeToNewsletterController
);

export default newsLetterRouter;

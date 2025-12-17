import { z } from "zod";

export const subscribeToNewsletterZodSchema = z.strictObject({
  email: z.string().email("Invalid email address"),
});

export type SubscribeToNewsletterType = z.infer<
  typeof subscribeToNewsletterZodSchema
>;

import { z } from "zod";

export const createBrandZodSchema = z.strictObject({
  name: z.string().min(1, "Brand name is required"),
  abbreviation: z.string().min(1, "Abbreviation is required"),
  description: z.string().optional(),
});

export const updateBrandZodSchema = z.strictObject({
  name: z.string().min(1, "Brand name is required").optional(),
  abbreviation: z.string().min(1, "Abbreviation is required").optional(),
  description: z.string().optional(),
});

export type CreateBrandFormType = z.infer<typeof createBrandZodSchema>;
export type UpdateBrandFormType = z.infer<typeof updateBrandZodSchema>;

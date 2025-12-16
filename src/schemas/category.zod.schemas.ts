import { z } from "zod";

export const createCategoryZodSchema = z.strictObject({
  name: z.string().min(1, "Category name is required"),
  abbreviation: z.string().min(1, "Abbreviation is required"),
  description: z.string().optional(),
});

export const updateCategoryZodSchema = z.strictObject({
  name: z.string().min(1, "Category name is required").optional(),
  abbreviation: z.string().min(1, "Abbreviation is required").optional(),
  description: z.string().optional(),
});

export type CreateCategoryFormType = z.infer<typeof createCategoryZodSchema>;
export type UpdateCategoryFormType = z.infer<typeof updateCategoryZodSchema>;

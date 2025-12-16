import { z } from "zod";

export const createStoreZodSchema = z.strictObject({
  name: z.string().min(1, { message: "Store name is required" }),
  code: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  manager_id: z.string().optional(),
});

export const updateStoreZodSchema = createStoreZodSchema.partial();

export type UpdateStoreFormType = z.infer<typeof updateStoreZodSchema>;
export type CreateStoreFormType = z.infer<typeof createStoreZodSchema>;

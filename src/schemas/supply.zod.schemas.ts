import { z } from "zod";

export const createSupplyZodSchema = z.strictObject({
  supplier_name: z.string().min(1, "Supplier name is required"),
  supplier_contact: z.string().min(1, "Supplier contact is required"),
  store_id: z.string().min(1, "Store ID is required"),
  date_supplied: z.string().or(z.date()),
  items: z
    .array(
      z.strictObject({
        product_id: z.string().min(1, "Product ID is required"),
        total_quantity: z
          .number()
          .int("Quantity must be an integer")
          .nonnegative("Quantity cannot be negative"),
        variations: z
          .array(
            z.strictObject({
              variant_sku: z.string().min(1, "SKU is required"),
              quantity: z
                .number()
                .int("Quantity must be an integer")
                .positive("Quantity must be positive"),
            })
          )
          .optional(),
      })
    )
    .min(1, "At least one product is required"),
});

export type CreateSupplyFormType = z.infer<typeof createSupplyZodSchema>;

export const updateSupplyZodSchema = createSupplyZodSchema.partial();

export type UpdateSupplyFormType = z.infer<typeof updateSupplyZodSchema>;

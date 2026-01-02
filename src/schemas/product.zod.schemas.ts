import { z } from "zod";
import { ProductStatus, Unit } from "../models/mongoose";
import {
  allowedProductSizeVariation,
  ProductImageUploadType,
} from "../types/product.type";

// ✅ User registration schema
export const UnitEnum = z.nativeEnum(Unit, {
  error: "Unit is required",
});

export const ProductStatusEnum = z.nativeEnum(ProductStatus, {
  error: "Product status is required",
});

/* export const ProductSizeEnum = z.enum(["SM", "MD", "LG"], {
error: "Product size is required",
}); */
/* export const ProductSizeEnum = z.array(z.enum(["SM", "MD", "LG"]), {
  error: "Product size is required",
}); */

/* const priceSchema = z.object({
  cost_price: z
    .union([z.number(), z.string()])
    .refine((v) => !isNaN(Number(v)), "Cost price must be a valid number")
    .refine((v) => Number(v) >= 0, "Cost price cannot be negative"),

  selling_price: z
    .union([z.number(), z.string()])
    .refine((v) => !isNaN(Number(v)), "Selling price must be a valid number")
    .refine((v) => Number(v) >= 0, "Selling price cannot be negative"),
});
 */
// Product sizes object
export const ColorVariantSchema = z.object({
  name: z.string().min(1, "Color name is required"),
  image_url: z.string().url().optional().nullable(),
  stocks: z
    .array(
      z.object({
        store_id: z.string().min(1, "Store ID is required"),
        stock: z.coerce.number().min(0, "Stock cannot be negative"),
      })
    )
    .default([]),
});

export const MaterialVariantSchema = z.object({
  name: z.string().min(1, "Material name is required"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  cost_price: z.coerce
    .number()
    .min(0, "Cost price cannot be negative")
    .optional(),
  colors: z.array(ColorVariantSchema).min(1, "At least one color is required"),
});

export const SizeVariantSchema = z.object({
  size: z.enum(allowedProductSizeVariation),
  materials: z
    .array(MaterialVariantSchema)
    .min(1, "At least one material is required"),
});

export const ProductSizeSchema = z
  .array(SizeVariantSchema)
  // .min(1, "At least one size must be provided")
  .refine((arr) => new Set(arr.map((i) => i.size)).size === arr.length, {
    message: "Duplicate sizes are not allowed",
  });

export const createProductZodSchema = z
  .strictObject({
    name: z
      .string()
      .min(2, "Product name is too short")
      .max(255, "Product name is too long"),

    // sku: z.string().min(1, "SKU is required"),

    description: z.string().nullable().optional(),

    cost_price: z
      .union([z.number(), z.string()])
      .refine((v) => !isNaN(Number(v)), "Cost price must be a valid number")
      .refine((v) => Number(v) >= 0, "Cost price cannot be negative")
      .nullable(),

    selling_price: z
      .union([z.number(), z.string()])
      .refine((v) => !isNaN(Number(v)), "Selling price must be a valid number")
      .refine((v) => Number(v) >= 0, "Selling price cannot be negative")
      .nullable(),

    quantity_in_stock: z
      .union([z.number(), z.string()])
      .refine((v) => !isNaN(Number(v)), "Stock quantity must be a valid number")
      .refine((v) => Number(v) >= 0, "Stock quantity cannot be negative")
      .nullable()
      .optional(),

    unit: UnitEnum.default(Unit.PCS),

    // status: ProductStatusEnum.default("active"),
    has_variants: z.boolean().default(false),

    category_id: z.string().min(1, "Category ID is required"),
    brand_id: z.string().optional(),
    store_id: z.string().optional(),
    size_variation: ProductSizeSchema.nullable().optional(),
    supplier_id: z.string().nullable().optional(),
    stocks: z
      .array(
        z.object({
          store_id: z.string(),
          stock: z.coerce.number().min(0),
        })
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    // If product doesn't have variations, require base prices and stock
    if (!data.has_variants) {
      if (!data.selling_price || Number(data.selling_price) === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selling price is required for products without variations",
          path: ["selling_price"],
        });
      }

      if (!data.cost_price || Number(data.cost_price) === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cost price is required for products without variations",
          path: ["cost_price"],
        });
      }

      if (!data.stocks || data.stocks.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "At least one store stock is required for products without variations",
          path: ["stocks"],
        });
      }
    }

    // If product has variations, require at least one complete variation
    if (data.has_variants) {
      if (!data.size_variation || data.size_variation.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "At least one size variation is required when product has variations",
          path: ["size_variation"],
        });
      } else {
        // Validate each variation has complete data
        data.size_variation.forEach((sizeVar, sizeIdx) => {
          sizeVar.materials.forEach((material, matIdx) => {
            if (!material.price || Number(material.price) === 0) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Price is required for all material variations",
                path: ["size_variation", sizeIdx, "materials", matIdx, "price"],
              });
            }

            material.colors.forEach((color, colorIdx) => {
              if (!color.stocks || color.stocks.length === 0) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message:
                    "At least one store stock is required for each color",
                  path: [
                    "size_variation",
                    sizeIdx,
                    "materials",
                    matIdx,
                    "colors",
                    colorIdx,
                    "stocks",
                  ],
                });
              }
            });
          });
        });
      }
    }
  });

// ✅ Infer type from Zod schema
export type CreateProductFormType = z.infer<typeof createProductZodSchema> & {
  images: ProductImageUploadType[];
};

export const updateProductZodSchema = createProductZodSchema.partial().extend({
  status: ProductStatusEnum.optional(),
});

export type UpdateProductFormType = z.infer<typeof updateProductZodSchema> & {
  images?: ProductImageUploadType[];
};

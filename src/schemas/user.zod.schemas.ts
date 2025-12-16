import { z } from "zod";

// ✅ User registration schema
export const createUserZodSchema = z.strictObject({
  fullname: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(30, "Password too long"),
  role: z.enum(["ADMIN", "MANAGER", "CASHIER", "CUSTOMER"], {
    error: "Staff role is required",
  }),
  store_id: z.string(),
});

// ✅ Infer type from Zod schema
export type CreateUserFormType = z.infer<typeof createUserZodSchema>;

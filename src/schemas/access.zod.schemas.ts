import { z } from "zod";

// ✅ User registration schema
export const userRegistrationZodSchema = z.strictObject({
  fullname: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is too short"),
  store_id: z.string().optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(30, "Password too long"),
  /* confirm_password: z
      .string()
      .min(6, "Confirm password must be at least 6 characters"), */
});
/* .refine((data) => data.password === data.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords must match",
  }); */
// ✅ Infer type from Zod schema
export type UserRegistrationFormType = z.infer<
  typeof userRegistrationZodSchema
>;

// ✅ User login schema
export const userLoginZodSchema = z.strictObject({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(30, "Password too long"),
});
// ✅ Infer type from Zod schema
export type UserLoginFormType = z.infer<typeof userLoginZodSchema>;

/***********************************/
/** RECEPTION SECTION STARTS HERE **/
/***********************************/
// ✅ User login schema
export const receptionLoginZodSchema = z.strictObject({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(30, "Password too long"),
});
// ✅ Infer type from Zod schema
export type ReceptionLoginFormType = z.infer<typeof receptionLoginZodSchema>;

/*******************************/
/** ADMIN SECTION STARTS HERE **/
/*******************************/
// ✅ User login schema
export const adminLoginZodSchema = z.strictObject({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(30, "Password too long"),
});
// ✅ Infer type from Zod schema
export type AdminLoginFormType = z.infer<typeof adminLoginZodSchema>;

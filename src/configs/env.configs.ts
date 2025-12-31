import dotenv from "dotenv";
import Jwt from "jsonwebtoken";
import type { StringValue } from "ms";

dotenv.config();

export const NODE_ENV = process.env.NODE_ENV as
  | "development"
  | "production"
  | "local";

export const BACKEND_DOMAIN = process.env.BACKEND_DOMAIN as string;
export const CLIENT_DOMAIN = process.env.CLIENT_DOMAIN as string;

/* Database Configurations */
export const DB_HOST = process.env.DB_HOST as string;
const rawUrl = process.env.DATABASE_URL;
export const DATABASE_URL =
  rawUrl && rawUrl.trim().startsWith("mongodb")
    ? rawUrl.trim()
    : "mongodb://127.0.0.1:27017/vicelamoda_store_dev";
export const DB_USER_NAME = process.env.DB_USER_NAME as string;
export const DB_PASSWORD = process.env.DB_PASSWORD as string;
export const DB_NAME = process.env.DB_NAME as string;
export const DB_PORT = (process.env.DB_PORT as number | undefined) || 3306;

/* SMTP Configurations */
export const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL as string;
export const SMTP_SENDER_NAME = process.env.SMTP_SENDER_NAME as string;
export const SMTP_HOST = process.env.SMTP_HOST as string;
export const SMTP_PORT = process.env.SMTP_PORT as number | string;
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD as string;
export const SMTP_USER = process.env.SMTP_USER as string;
export const SMTP_SECURITY = process.env.SMTP_SECURITY as boolean | string;

/* GMAIL Configurations */
export const GMAIL_FROM_EMAIL = process.env.GMAIL_FROM_EMAIL as string;
export const GMAIL_SENDER_NAME = process.env.GMAIL_SENDER_NAME as string;
export const GMAIL_HOST = process.env.GMAIL_HOST as string;
export const GMAIL_PORT = process.env.GMAIL_PORT as number | string;
export const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD as string;
export const GMAIL_USER = process.env.GMAIL_USER as string;
export const GMAIL_SECURITY = process.env.GMAIL_SECURITY as boolean | string;

/* JWT Configurations */
export const JWT_ALGORITHM = process.env.JWT_ALGORITHM as Jwt.Algorithm;
export const JWT_ACCESS_KEY = process.env.JWT_ACCESS_KEY as string;
export const JWT_RESET_KEY = process.env.JWT_RESET_KEY as string;

/* Cookie and Token Configurations */
export const REFRESH_TOKEN_KEY = process.env.REFRESH_TOKEN_KEY as string;
export const SESSION_SECRET_KEY = process.env.SESSION_SECRET_KEY as string;
export const COOKIE_EXPIRY = process.env.COOKIE_EXPIRY as string | number;
export const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY as
  | StringValue
  | number;
export const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY as
  | StringValue
  | number;

/* Table Configurations */
export const APP_INFO_TBL = process.env.APP_INFO_TBL as string;
export const HUB_TBL = process.env.HUB_TBL as string;
export const HUB_CAPACITY_TBL = process.env.HUB_CAPACITY_TBL as string;
export const OPENING_HOURS_TBL = process.env.OPENING_HOURS_TBL as string;
export const USERS_TBL = process.env.USERS_TBL as string;
export const BOOKING_TBL = process.env.BOOKING_TBL as string;
export const BOOKING_DAY_TBL = process.env.BOOKING_DAY_TBL as string;
export const ATTENDANCE_TBL = process.env.ATTENDANCE_TBL as string;

/* Dummy Admin Details */
export const ADMIN_NAME = process.env.ADMIN_NAME as string;
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL as string;
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD as string;

/* Dummy User Details */
export const USER_NAME = process.env.USER_NAME as string;
export const USER_EMAIL = process.env.USER_EMAIL as string;
export const USER_PASSWORD = process.env.USER_PASSWORD as string;

/* Paystack Details */
export const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL as string;
export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY as string;
export const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY as string;

/* Argon2 Configurations */
export const ARGON2_MEMORY_COST = process.env.ARGON2_MEMORY_COST as
  | number
  | string;
export const ARGON2_TIME_COST = process.env.ARGON2_TIME_COST as number | string;

/* Firebase Configurations */
export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID as string;
const RAW_FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL as string;
export const FIREBASE_CLIENT_EMAIL = RAW_FIREBASE_CLIENT_EMAIL.replace(
  /\\n/g,
  "\n"
);
export const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY as string;

// AI / LLM configuration (re-exported from a dedicated AI config)
export { DEFAULT_AI_MODEL, ENABLE_CLAUDE_FOR_ALL_CLIENTS } from "./ai.config";

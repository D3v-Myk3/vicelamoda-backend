import { Request, Response } from "express";
import { StoreTblType } from "./store.types";
import { UserTblType } from "./user.type";
/* eslint-disable @typescript-eslint/no-explicit-any */
export type JSONResponseType<T = string> = {
  data: T;
  message: string;
  status?: number;
  pagination?: PaginatedResult;
};

export type PaginationParams = {
  cursor?: string;
  limit?: number;
};

export type PaginatedResult = {
  nextCursor: string | number | null;
  hasNextPage: boolean;
};

export type DefaultReturnObj<T> = {
  // data: QueryResult;
  data: JSONResponseType<T> | null;
  errorMessage: string | null;
  source: string;
  status: number;
};

export type DefaultQueryBuilderReturnObj<T> = {
  // data: QueryResult;
  data: T;
  errorMessage: null | string;
  source: string;
  status: number;
  pagination?: PaginatedResult;
};

export type DefaultUtilsReturnObj<T> = {
  // data: QueryResult;
  data: T | string;
  errorMessage: null | string;
  source: string;
  status: number;
};

export type DefaultErrorReturnObj<T = null> = {
  // data: QueryResult;
  data: T;
  errorMessage: null | string;
  source: string;
  status: number;
};

export type Token<T = null> = {
  accessToken: string;
  refreshToken?: string;
  account_data?: T;
  user_store?: StoreTblType[];
  // school_data?: LoginSchoolDataType | SchoolInfoTblType;
};

export interface MulterRequest extends Request {
  files?: { [fieldname: string]: Express.Multer.File[] }; // For multiple files
  file?: Express.Multer.File; // For single file
}

export type GeneralGenderType = "Male" | "Female";

export type visibilityActionType = "enable" | "disable";

export type GeneralVisibleType = "Yes" | "No";

export type DBConfigs = {
  db_name?: string;
  // MongoDB connection is handled globally via mongoose.config.ts
};
// Define ModelFunctionParam with two generics:
// - T: Type of params
// - U: Type of QueryBuilderReturn's data
export type ModelFunctionParamType<T, U = null> = (
  params: T,
  db_config?: DBConfigs
) => Promise<DefaultQueryBuilderReturnObj<U>>;

// Define ServiceFunctionParam with two generics:
// - T: Type of params
// - U: Type of QueryBuilderReturn's data
export type ContextType = {
  deviceInfo?: string;
  debugMode?: boolean;
  user_data?: UserTblType;
  admin_data?: UserTblType;
  manager_data?: UserTblType;
  cashier_data?: UserTblType;
};
export type ServiceFunctionParamType<T = unknown, U = string> = (
  params: T,
  // prisma_connection?: prismaConnType,
  context: ContextType
  // connection?: PoolConnection
) => Promise<DefaultReturnObj<U | string>>;

export type ContextlessServiceFunctionParamType<T = unknown, U = string> = (
  params: T,
  // prisma_connection?: prismaConnType,
  context?: ContextType
  // connection?: PoolConnection
) => Promise<DefaultReturnObj<U | string>>;

export interface CustomRequest<
  P = unknown, // Parameters (e.g., route params)
  ResBody = unknown, // Response body
  ReqBody = unknown, // Request body
  ReqQuery = unknown, // Query parameters
> extends Request<
    P extends null ? Record<string, any> | undefined : P,
    ResBody,
    ReqBody,
    ReqQuery
  > {
  signedCookies: {
    ss_rt?: string;
    ss_sd_rt?: string;
    ss_st_rt?: string;
    ss_of_rt?: string;
  };
}

// Define CustomResponse with generics
export interface CustomResponse<
  ResBody = null, // Response body
  Locals extends Record<string, any> = Record<string, any>, // Locals object
> extends Response<JSONResponseType<ResBody | string> | string, Locals> {
  locals: Locals & ContextType;
}

export type TblCount = { count: number };
export type TblCheckType = { TABLE_NAME: string };
export type TblColumnType = { COLUMN_NAME: string };
export type TblSchemaType = { SCHEMA_NAME: string };

export type LogLevelType = "error" | "warn" | "info" | "verbose" | "debug";
export type LogAndReturnType = {
  message: string;
  log_level: LogLevelType;
  source: string;
  context: string;
  status: number;
  details: Record<string, any>;
};

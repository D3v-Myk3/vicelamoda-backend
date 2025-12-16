import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger.configs";
import { ModelFunctionParamType } from "../types/general.types";
import {
  CreateUserType,
  FetchUsersType,
  RegisterUserType,
  UserTblType,
} from "../types/user.type";
import { UserModel } from "./mongoose/User.model";

export const fetchUsersModel: ModelFunctionParamType<
  FetchUsersType,
  UserTblType[] | null
> = async (params) => {
  const source = "GET ALL USERS MODEL";
  logger.info(`Fetching all users`, { source, params });

  // try {
  const query: any = {};

  if (params.role) query.role = params.role;
  if (params.user_id) query._id = params.user_id;
  if (params.email) query.email = params.email;
  if (params.name) query.fullname = { $regex: params.name, $options: "i" };

  let queryBuilder = UserModel.find(query).sort({ createdAt: -1 });

  // Handle constraints (populate relationships)
  if (params.constraints?.store) {
    queryBuilder = queryBuilder.populate("store_id", "name address phone");
  }

  const result = await queryBuilder.lean().exec();

  logger.info(`Fetch all users completed`, {
    source,
    params: params ?? {},
    found: Array.isArray(result) ? result.length : 0,
    status: result,
  });

  return {
    data: result.map((result) => ({
      ...result,
      _id: result._id.toString(),
    })) as unknown as UserTblType[],
    errorMessage: null,
    status: StatusCodes.OK,
    source,
  };
  /* } catch (error) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  }*/
};

// Register User Model
export const createUserModel: ModelFunctionParamType<
  Omit<RegisterUserType | CreateUserType, "confirm_password">,
  UserTblType | null
> = async (params) => {
  const source = "REGISTER USER MODEL";
  logger.info(`Registering user`, { source, params });

  // try {
  const userData: any = {
    fullname: params.fullname,
    email: params.email,
    password: params.password,
    role: (params as CreateUserType).role ?? "CUSTOMER",
  };

  if ((params as CreateUserType).store_id) {
    userData.store_id = (params as CreateUserType).store_id;
  }

  const result = await UserModel.create(userData);

  logger.info(`Register user completed`, {
    source,
    params: params ?? {},
  });

  const userDoc = await UserModel.findById(result._id).lean().exec();

  return {
    data: userDoc as unknown as UserTblType,
    errorMessage: null,
    status: StatusCodes.OK,
    source,
  };
  /* } catch (error) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  } */
};

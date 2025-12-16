import { IUser, UserRole } from "../models/mongoose/User.model";
import { UserRegistrationFormType } from "../schemas/access.zod.schemas";
import { CreateUserFormType } from "../schemas/user.zod.schemas";
import { StoreTblType } from "./store.types";

export type FetchUsersType = {
  role?: UserRole;
  user_id?: string;
  hub_id?: string;
  email?: string;
  name?: string;
  constraints?: {
    manager_stores?: boolean;
    // stock_movements?: boolean;
    store?: boolean;
  };
};

export type RegisterUserType = UserRegistrationFormType & {};

export type CreateUserType = CreateUserFormType & {};

export type UserTblType = IUser & {
  _id: string;
  store?: string | StoreTblType;
};

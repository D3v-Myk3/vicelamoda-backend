import { UserRole } from "../models/mongoose/User.model";

export const isPersonnelAUserHelper = (
  value: UserRole
): value is UserRole => {
  return ([UserRole.CUSTOMER] as UserRole[]).includes(value);
};

export const isPersonnelACashierHelper = (
  value: UserRole
): value is UserRole => {
  return ([UserRole.CASHIER] as UserRole[]).includes(value);
};

export const isPersonnelAnAdminHelper = (
  value: UserRole
): value is UserRole => {
  return ([UserRole.ADMIN, UserRole.MANAGER] as UserRole[]).includes(value);
};

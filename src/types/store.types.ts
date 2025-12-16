import { IStore } from "../models/mongoose/Store.model";
import { ProductTblType } from "./product.type";
import { UserTblType } from "./user.type";

export type StoreTblType = IStore & {
  manager?: UserTblType | null;
  _id: string;
};

export type CreateStoreType = {
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  manager_id?: string;
};

export type UpdateStoreType = Partial<CreateStoreType>;

export type FetchStoresType = {
  store_id?: string;
  name?: string;
  code?: string;
  manager_id?: string;
};

export type FetchSingleStoreType = {
  store_id: string;
};

export type StoreConstraintsType = {
  users?: boolean;
  stocks?: boolean;
  sales?: boolean;
};

// Stock movements are now handled through Supply and Order models
// This type is kept for backward compatibility but may not be used
export type StockMovementsTblType = {
  movement_id: string;
  change_type: "in" | "out" | "adjustment";
  quantity: number;
  reason?: string;
  product_id?: string;
  recorded_by: string;
  store_id?: string;
  createdAt: Date;
  updatedAt: Date;
  product?: ProductTblType;
  store?: StoreTblType;
  user?: UserTblType;
};

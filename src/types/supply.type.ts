import { ISuppliedProduct, ISupply } from "../models/mongoose/Supply.model";
import { CreateSupplyFormType } from "../schemas/supply.zod.schemas";
import { StockMovementsTblType, StoreTblType } from "./store.types";

export type CreateSupplyType = CreateSupplyFormType & {
  recorded_by: string;
};

export type SupplyTblType = ISupply & {
  products: (ISuppliedProduct & {
    product?: { name: string; sku: string; selling_price: number };
  })[];
  store?: StoreTblType;
  stock_movements?: StockMovementsTblType[];
};

export type SupplyConstraintsType = {
  products?: boolean;
  store?: boolean;
  stockMovements?: boolean;
};

import { PaginationParams } from "./general.types";

export type FetchSuppliesType = PaginationParams & {
  // Existing filters
  supply_id?: string;
  supplier_name?: string;
  store_id?: string;
  recorded_by?: string;
  start_date?: Date | string;
  end_date?: Date | string;

  // Enhanced search
  search?: string; // General search across supplier_name and supplier_contact
  supplier_contact?: string;

  constraints?: SupplyConstraintsType;
};

export type FetchSingleSupplyType = {
  supply_id: string;
  constraints: SupplyConstraintsType;
};

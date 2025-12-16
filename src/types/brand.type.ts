import { PaginationParams } from "./general.types";
import { IBrand } from "../models/mongoose/Brand.model";
import { IProduct } from "../models/mongoose/Product.model";

export type FetchBrandsType = PaginationParams & {
  // Existing filters
  brand_id?: string;
  name?: string;
  abbreviation?: string;

  // Enhanced search
  search?: string; // General search across name, abbreviation, description

  constraints?: {
    products?: boolean;
  };
};

export type FetchSingleBrandType = {
  brand_id: string;
  constraints?: {
    products?: boolean;
  };
};

export type BrandTblType = IBrand & {
  products?: IProduct[];
};

export type CreateBrandType = {
  name: string;
  abbreviation: string;
  description?: string | null;
};

export type UpdateBrandType = {
  name?: string;
  abbreviation?: string;
  description?: string | null;
};

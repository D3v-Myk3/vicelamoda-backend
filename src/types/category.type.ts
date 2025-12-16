import { PaginationParams } from "./general.types";
import { ICategory } from "../models/mongoose/Category.model";
import { IProduct } from "../models/mongoose/Product.model";

export type FetchCategoriesType = PaginationParams & {
  // Existing filters
  category_id?: string;
  name?: string;
  abbreviation?: string;

  // Enhanced search
  search?: string; // General search across name, abbreviation, description

  constraints?: {
    products?: boolean;
  };
};

export type FetchSingleCategoryType = {
  category_id: string;
  constraints?: {
    products?: boolean;
  };
};

export type CategoryTblType = ICategory & {
  products?: IProduct[];
};

export type CreateCategoryType = {
  name: string;
  abbreviation: string;
  description?: string | null;
};

export type UpdateCategoryType = {
  name?: string;
  abbreviation?: string;
  description?: string | null;
};

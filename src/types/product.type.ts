import {
  IProduct,
  IStoreStock,
  IVariationOption,
  ProductSize,
} from "../models/mongoose/Product.model";
import { CreateProductFormType } from "../schemas/product.zod.schemas";
import { PaginationParams } from "./general.types";

export type ProductSizeType = ProductSize;

export const allowedProductSizeVariation: ProductSize[] = [
  ProductSize.SMALL,
  ProductSize.MEDIUM,
  ProductSize.LARGE,
  ProductSize.EXTRA_LARGE,
  ProductSize.STANDARD,
];

export const sizeVariations: Record<
  ProductSize,
  { name: string; value: string; db_value: ProductSize }
> = {
  [ProductSize.SMALL]: {
    name: "Small Size",
    value: "SM",
    db_value: ProductSize.SMALL,
  },
  [ProductSize.MEDIUM]: {
    name: "Medium Size",
    value: "MD",
    db_value: ProductSize.MEDIUM,
  },
  [ProductSize.LARGE]: {
    name: "Large Size",
    value: "LG",
    db_value: ProductSize.LARGE,
  },
  [ProductSize.EXTRA_LARGE]: {
    name: "Extra Large Size",
    value: "XL",
    db_value: ProductSize.EXTRA_LARGE,
  },
  [ProductSize.STANDARD]: {
    name: "Standard Size",
    value: "STD",
    db_value: ProductSize.STANDARD,
  },
};

export type ProductConstraintsType = {
  category?: boolean;
  brand?: boolean;
  // supplier?: boolean;
  images?: boolean;
  store_stocks?: boolean;
  stock_movements?: boolean;
};

export type FetchProductsType = PaginationParams & {
  // Existing filters
  product_id?: string;
  name?: string;
  status?: "active" | "inactive";
  category_id?: string;

  // Enhanced search
  search?: string; // General search across name, sku, description
  sku?: string;
  brand_id?: string;
  size?: ProductSize;

  // Range filters
  min_quantity?: number | string;
  max_quantity?: number | string;
  min_price?: number | string;
  max_price?: number | string;

  constraints?: ProductConstraintsType;
};

export type FetchSingleProductType = {
  product_id: string;
  constraints?: ProductConstraintsType;
};

export type FetchProductByBarcodeType = {
  barcode: string;
  constraints?: ProductConstraintsType;
};

export type ProductTblType = IProduct & {
  // category_id?: string | CategoryTblType;
  category?: string;
  brand?: string;
};

export type ProductImageUploadType = {
  image_url: string;
  is_primary?: boolean;
};

export type CreateColorVariant = {
  name: string;
  image_url?: string;
  stocks: IStoreStock[];
};

export type CreateMaterialVariant = {
  name: string;
  price: number;
  cost_price?: number;
  colors: CreateColorVariant[];
};

export type CreateSizeVariant = {
  size: ProductSize;
  materials: CreateMaterialVariant[];
};

export type CreateProductType = CreateProductFormType & {
  quantity_in_stock?: number | string;
  unit?: "pcs" | "ml" | "ltr" | "g" | "kg" | "pack" | "box" | string;
  category_id: string;
  brand_id?: string;
  store_id?: string;
  sku: string;
  stocks?: IStoreStock[];
  // supplier_id?: string | null;
  images?: ProductImageUploadType[];
  size?: ProductSize;
  has_variants?: boolean;
  variants: CreateSizeVariant[];
  variation_options?: IVariationOption[];
  status?: "active" | "inactive";
};

export type UpdateProductType = Partial<CreateProductType>;

export type UpdateProductServiceParam = {
  product_id: string;
  update_data: UpdateProductType;
};

export interface FetchProductResponse {
  id: string;
  slug: string;
  product_name: string;
  product_description: string;
  product_price: number;
  product_images: string[];
  category_id: string;
  category: string;
  sizes: string[];
  colors: { name: string; value: string }[];
  stock_quantity: number;
  sku: string;
  barcode?: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

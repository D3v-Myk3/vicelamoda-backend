import { IWishlist } from "../models/mongoose/Wishlist.model";

/* export interface WishlistItemType {
  product: string | ProductTblType;
  // variant_sku?: string;
  addedAt: Date;
} */

export interface WishlistTblType extends IWishlist {}

export interface FetchWishlistType {
  user_id: string;
}

export interface AddToWishlistType {
  // user_id: string;
  product_id: string;
  // variant_sku?: string;
}

export interface RemoveFromWishlistType {
  // user_id: string;
  product_id: string;
  // variant_sku?: string;
}

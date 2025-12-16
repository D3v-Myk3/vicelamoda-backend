import mongoose, { Document, Schema } from "mongoose";
import { ProductTblType } from "../../types/product.type";

export interface WishlistItem {
  product: mongoose.Types.ObjectId | ProductTblType;
  addedAt: Date;
}

export interface IWishlist extends Document {
  user_id: mongoose.Types.ObjectId;
  products: WishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const WishlistSchema: Schema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        /*  variant_sku: {
          type: String,
          required: false,
        }, */
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IWishlist>("Wishlist", WishlistSchema);

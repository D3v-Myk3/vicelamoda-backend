import mongoose, { Document, Schema } from "mongoose";

export interface IBrand extends Document {
  brand_id: string;
  name: string;
  abbreviation: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema = new Schema<IBrand>(
  {
    brand_id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `brd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    name: {
      type: String,
      required: true,
      // index: true,
    },
    abbreviation: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
  },
  {
    timestamps: true,
    collection: "product_brands",
  }
);

BrandSchema.index({ name: 1 });

BrandSchema.virtual("products", {
  ref: "Product",
  localField: "brand_id",
  foreignField: "brand_id",
});

export const BrandModel = mongoose.model<IBrand>("ProductBrand", BrandSchema);

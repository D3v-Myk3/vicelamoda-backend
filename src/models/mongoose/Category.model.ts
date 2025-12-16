import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
  category_id: string;
  name: string;
  abbreviation: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    category_id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    collection: "product_categories",
  }
);

CategorySchema.index({ name: 1 });

CategorySchema.virtual("products", {
  ref: "Product",
  localField: "category_id",
  foreignField: "category_id",
});

export const CategoryModel = mongoose.model<ICategory>(
  "ProductCategory",
  CategorySchema
);

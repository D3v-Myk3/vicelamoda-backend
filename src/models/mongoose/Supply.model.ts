import mongoose, { Document, Schema } from "mongoose";

export enum ChangeType {
  in = "in",
  out = "out",
  adjustment = "adjustment",
}

export interface ISuppliedProduct {
  public_id: string;
  product_id: string;
  quantity: number;
  variant_sku?: string;
  variant_name?: string;
  date_supplied: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface ISupply extends Document {
  supply_id: string;
  supplier_name: string;
  supplier_contact: string;
  date_supplied: Date;
  recorded_by: string;
  store_id: string;
  products: ISuppliedProduct[];
  createdAt: Date;
  updatedAt: Date;
}

const SuppliedProductSchema = new Schema<ISuppliedProduct>(
  {
    public_id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `spp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    product_id: {
      type: String,
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    date_supplied: {
      type: Date,
      default: Date.now,
    },
    variant_sku: {
      type: String,
      sparse: true,
    },
    variant_name: String,
  },
  {
    timestamps: true,
  }
);

const SupplySchema = new Schema<ISupply>(
  {
    supply_id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `sup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    supplier_name: {
      type: String,
      required: true,
      index: true,
    },
    supplier_contact: {
      type: String,
      required: true,
    },
    date_supplied: {
      type: Date,
      default: Date.now,
      index: true,
    },
    recorded_by: {
      type: String,
      required: true,
      index: true,
    },
    store_id: {
      type: String,
      required: true,
      index: true,
    },
    products: {
      type: [SuppliedProductSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "store_supllies",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ===================== VIRTUALS ===================== */

SupplySchema.virtual("store", {
  ref: "Store",
  localField: "store_id",
  foreignField: "store_id",
  justOne: true,
});

SupplySchema.virtual("recorder", {
  ref: "User",
  localField: "recorded_by",
  foreignField: "user_id",
  justOne: true,
});

SupplySchema.index({
  recorded_by: 1,
  store_id: 1,
  supplier_contact: 1,
  supplier_name: 1,
});
SupplySchema.index({ createdAt: -1 });
// SupplySchema.index({ supplier_name: 1 });

// Composite Indexes
SupplySchema.index({ store_id: 1, date_supplied: -1 });

export const SupplyModel = mongoose.model<ISupply>("Supply", SupplySchema);

import mongoose, { Document, Schema } from "mongoose";

export enum PromoType {
  PERCENTAGE = "PERCENTAGE",
  FIXED_AMOUNT = "FIXED_AMOUNT",
}

export interface IPromo extends Document {
  promo_id: string;
  code: string;
  description?: string;
  type: PromoType;
  value: number; // percentage (0-100) or fixed amount
  min_purchase_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  used_count: number;
  valid_from: Date;
  valid_until: Date;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromoSchema = new Schema<IPromo>(
  {
    promo_id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `prm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      // index: true,
    },
    description: String,
    type: {
      type: String,
      enum: Object.values(PromoType),
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    min_purchase_amount: Number,
    max_discount_amount: Number,
    usage_limit: Number,
    used_count: {
      type: Number,
      default: 0,
    },
    valid_from: {
      type: Date,
      required: true,
      index: true,
    },
    valid_until: {
      type: Date,
      required: true,
      index: true,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "promos",
  }
);

// PromoSchema.index({ code: 1 });
PromoSchema.index({ is_active: 1, valid_from: 1, valid_until: 1 });

export const PromoModel = mongoose.model<IPromo>("Promo", PromoSchema);

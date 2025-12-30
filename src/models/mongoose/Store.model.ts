import mongoose, { Document, Schema } from "mongoose";

export interface IStore extends Document {
  store_id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  manager_id?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
  {
    store_id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `str_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    name: {
      type: String,
      required: true,
      // index: true,
    },
    code: {
      type: String,
      unique: true,
      sparse: true,
      required: true,
    },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    manager_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      set: (val: any) => (val === "" ? null : val),
      // index: true,
    },
  },
  {
    timestamps: true,
    collection: "store",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ===================== VIRTUALS ===================== */

/* StoreSchema.virtual("manager", {
  ref: "User",
  localField: "manager_id",
  foreignField: "user_id",
  justOne: true,
}); */

StoreSchema.index({ name: 1 });
StoreSchema.index({ manager_id: 1 });

export const StoreModel = mongoose.model<IStore>("Store", StoreSchema);

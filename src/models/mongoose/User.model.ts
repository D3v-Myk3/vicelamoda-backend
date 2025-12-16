import mongoose, { Document, Schema } from "mongoose";

export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  CASHIER = "CASHIER",
  CUSTOMER = "CUSTOMER",
}

export enum Visibility {
  Yes = "Yes",
  No = "No",
}

export interface IUser extends Document {
  user_id: string;
  fullname: string;
  email: string;
  password: string;
  role: UserRole;
  visible: Visibility;
  phone?: string;
  store?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    fullname: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
      index: true,
    },
    visible: {
      type: String,
      enum: Object.values(Visibility),
      default: Visibility.Yes,
    },
    phone: {
      type: String,
      default: null,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      // index: true,
    },
  },
  {
    timestamps: true,
    collection: "users",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ===================== VIRTUALS ===================== */

// Relationship to tally/list all orders for this user
UserSchema.virtual("orders", {
  ref: "Order",
  localField: "user_id",
  foreignField: "user_id",
  justOne: false,
});

// UserSchema.index({ fullname: 1 });
// UserSchema.index({ role: 1 });
UserSchema.index({ store: 1 });

export const UserModel = mongoose.model<IUser>("User", UserSchema);

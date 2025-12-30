import mongoose, { Document, Schema } from "mongoose";

export interface NewsletterTblType extends Document {
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const NewsletterModel = mongoose.model<NewsletterTblType>(
  "Newsletter",
  NewsletterSchema
);

import mongoose, { Schema } from "mongoose";
import { INotification, NotificationType } from "../../types/notification.type";

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      default: NotificationType.INFO,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    url: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

export const NotificationModel = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);

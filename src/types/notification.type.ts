import mongoose, { Document } from "mongoose";

export enum NotificationType {
  INFO = "INFO",
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationTblType = INotification & {
  _id: string;
};

export type FetchNotificationsParams = {
  recipient: string;
  read?: boolean;
  limit?: number;
  offset?: number;
};

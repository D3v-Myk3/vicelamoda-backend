import express from "express";
import {
  fetchNotificationsController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController,
} from "../../controllers/notification.controller";

const adminNotificationRoutes = express.Router();

adminNotificationRoutes.get("/", fetchNotificationsController);
adminNotificationRoutes.put(
  "/mark-all-read",
  markAllNotificationsAsReadController
);
adminNotificationRoutes.put("/:id/read", markNotificationAsReadController);

export default adminNotificationRoutes;

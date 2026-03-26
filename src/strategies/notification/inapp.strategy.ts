import { connectDB } from "@/libs/mongodb";
import Notification from "@/models/Notification";
import { sseManager } from "@/lib/sse";
import type { NotificationStrategy, NotificationPayload } from "./notification.strategy";

export class InAppNotificationStrategy implements NotificationStrategy {
  async send(payload: NotificationPayload): Promise<boolean> {
    try {
      await connectDB();

      const notification = await Notification.create({
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data,
        read: false,
        channel: "inapp",
        deliveryStatus: "sent",
      });

      // Push via SSE to connected client
      sseManager.sendToUser(payload.userId, "notification", {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: false,
        data: notification.data,
        createdAt: notification.createdAt,
      });

      return true;
    } catch (error) {
      console.error("In-app notification failed:", error);
      return false;
    }
  }
}

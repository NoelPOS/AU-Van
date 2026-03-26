import { sseManager } from "@/lib/sse";
import type { NotificationStrategy, NotificationPayload, NotificationResult } from "./notification.strategy";

export class InAppNotificationStrategy implements NotificationStrategy {
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      sseManager.sendToUser(payload.userId, "notification", {
        type: payload.type,
        title: payload.title,
        message: payload.message,
        read: false,
        data: payload.data,
        createdAt: new Date(),
      });

      return { success: true, channel: "inapp", deliveryStatus: "sent" };
    } catch (error) {
      console.error("In-app notification failed:", error);
      return { success: false, channel: "inapp", deliveryStatus: "failed" };
    }
  }
}

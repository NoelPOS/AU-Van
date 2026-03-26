import { connectDB } from "@/libs/mongodb";
import Notification from "@/models/Notification";
import { sendLinePushMessage } from "@/lib/line-messaging";
import type { NotificationStrategy, NotificationPayload } from "./notification.strategy";

export class LinePushNotificationStrategy implements NotificationStrategy {
  async send(payload: NotificationPayload): Promise<boolean> {
    if (!payload.lineUserId) return false;

    const result = await sendLinePushMessage(payload.lineUserId, [
      {
        type: "text",
        text: `${payload.title}\n${payload.message}`.slice(0, 4900),
      },
    ]);

    await connectDB();
    await Notification.create({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data,
      read: false,
      channel: "line_push",
      deliveryStatus: result.ok ? "sent" : "failed",
      externalMessageId: result.requestId || undefined,
    });

    return result.ok;
  }
}

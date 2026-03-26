import { sendLinePushMessage } from "@/lib/line-messaging";
import type { NotificationStrategy, NotificationPayload, NotificationResult } from "./notification.strategy";

export class LinePushNotificationStrategy implements NotificationStrategy {
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!payload.lineUserId) {
      return { success: false, channel: "line_push", deliveryStatus: "skipped" };
    }

    const result = await sendLinePushMessage(payload.lineUserId, [
      {
        type: "text",
        text: `${payload.title}\n${payload.message}`.slice(0, 4900),
      },
    ]);

    return {
      success: result.ok,
      channel: "line_push",
      deliveryStatus: result.ok ? "sent" : "failed",
      externalMessageId: result.requestId || undefined,
    };
  }
}

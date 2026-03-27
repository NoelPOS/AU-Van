import { sendLinePushMessage, type LinePushMessage } from "@/lib/line-messaging";
import type { NotificationStrategy, NotificationPayload, NotificationResult } from "./notification.strategy";

function buildManageBookingsUrl() {
  const liffId = (process.env.NEXT_PUBLIC_LINE_LIFF_ID || "").trim();
  if (liffId) return `https://liff.line.me/${liffId}/mybookings`;

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
  if (appUrl) return `${appUrl}/mybookings`;

  return "https://au-van-booking-system.vercel.app/mybookings";
}

function buildFallbackText(payload: NotificationPayload) {
  return `${payload.title}\n${payload.message}`.slice(0, 4900);
}

function buildRichMessage(payload: NotificationPayload): LinePushMessage {
  const data = (payload.data || {}) as Record<string, unknown>;
  const routeFrom = typeof data.routeFrom === "string" ? data.routeFrom : "";
  const routeTo = typeof data.routeTo === "string" ? data.routeTo : "";
  const date = typeof data.date === "string" ? data.date : "";
  const time = typeof data.time === "string" ? data.time : "";

  const tripLine =
    routeFrom && routeTo && date && time
      ? `${routeFrom} -> ${routeTo} | ${date} ${time}`
      : routeFrom && routeTo
        ? `${routeFrom} -> ${routeTo}`
        : "Open the app for full booking details";

  return {
    type: "flex",
    altText: buildFallbackText(payload),
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: payload.title,
            weight: "bold",
            size: "lg",
            color: "#1F2F8D",
            wrap: true,
          },
          {
            type: "text",
            text: payload.message,
            size: "sm",
            color: "#42527A",
            wrap: true,
          },
          {
            type: "separator",
            margin: "md",
          },
          {
            type: "text",
            text: tripLine,
            size: "xs",
            color: "#6F7CB6",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#3F53C9",
            action: {
              type: "uri",
              label: "Manage Booking",
              uri: buildManageBookingsUrl(),
            },
          },
        ],
      },
    },
  };
}

export class LinePushNotificationStrategy implements NotificationStrategy {
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!payload.lineUserId) {
      return { success: false, channel: "line_push", deliveryStatus: "skipped" };
    }

    const isAdminOnly = payload.type.startsWith("admin_");
    const richResult = isAdminOnly
      ? null
      : await sendLinePushMessage(payload.lineUserId, [buildRichMessage(payload)]);

    const result =
      richResult && richResult.ok
        ? richResult
        : await sendLinePushMessage(payload.lineUserId, [
            {
              type: "text",
              text: buildFallbackText(payload),
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

import { emailService } from "@/lib/email";
import type { NotificationStrategy, NotificationPayload, NotificationResult } from "./notification.strategy";

export class EmailNotificationStrategy implements NotificationStrategy {
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!payload.email) {
      return { success: false, channel: "email", deliveryStatus: "skipped" };
    }

    const sent = await emailService.send({
      to: payload.email,
      subject: payload.title,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#1a56db">AU Van</h2>
          <h3>${payload.title}</h3>
          <p>${payload.message}</p>
          ${
            payload.data
              ? `<div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
                  ${Object.entries(payload.data)
                    .map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`)
                    .join("")}
                </div>`
              : ""
          }
        </div>
      `,
    });

    return {
      success: sent,
      channel: "email",
      deliveryStatus: sent ? "sent" : "failed",
    };
  }
}

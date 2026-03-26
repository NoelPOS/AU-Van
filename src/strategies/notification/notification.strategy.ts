// Strategy Pattern - Notification Delivery

export interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  email?: string; // recipient email for email strategy
  lineUserId?: string;
}

export interface NotificationResult {
  success: boolean;
  channel: "email" | "inapp" | "line_push";
  deliveryStatus: "sent" | "failed" | "skipped";
  externalMessageId?: string;
}

export interface NotificationStrategy {
  send(payload: NotificationPayload): Promise<NotificationResult>;
}

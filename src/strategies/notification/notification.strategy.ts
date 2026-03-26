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

export interface NotificationStrategy {
  send(payload: NotificationPayload): Promise<boolean>;
}

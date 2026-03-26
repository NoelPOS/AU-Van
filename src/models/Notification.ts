import mongoose, { Schema, Document, Model } from "mongoose";

export interface NotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  read: boolean;
  channel?: "line_push" | "inapp" | "email";
  deliveryStatus?: "pending" | "sent" | "failed";
  externalMessageId?: string;
  data?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "booking_confirmed",
        "booking_cancelled",
        "booking_updated",
        "payment_received",
        "payment_failed",
        "seat_reminder",
        "admin_new_booking",
        "admin_cancellation",
        "system",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    channel: {
      type: String,
      enum: ["line_push", "inapp", "email"],
      default: "inapp",
      index: true,
    },
    deliveryStatus: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "sent",
      index: true,
    },
    externalMessageId: { type: String },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification: Model<NotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<NotificationDocument>("Notification", NotificationSchema);

export default Notification;

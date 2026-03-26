import mongoose, { Schema, Document, Model } from "mongoose";

export interface ReminderJobDocument extends Document {
  bookingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  lineUserId?: string;
  type: "departure_24h" | "departure_1h" | "departure_daily_batch";
  runAt: Date;
  status: "pending" | "processing" | "sent" | "failed" | "cancelled";
  attempts: number;
  lockedAt?: Date;
  sentAt?: Date;
  lastError?: string;
  payload?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ReminderJobSchema = new Schema<ReminderJobDocument>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lineUserId: { type: String, index: true },
    type: {
      type: String,
      enum: ["departure_24h", "departure_1h", "departure_daily_batch"],
      required: true,
      index: true,
    },
    runAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "processing", "sent", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    attempts: { type: Number, default: 0, min: 0 },
    lockedAt: { type: Date },
    sentAt: { type: Date },
    lastError: { type: String },
    payload: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ReminderJobSchema.index({ bookingId: 1, type: 1 }, { unique: true });
ReminderJobSchema.index({ status: 1, runAt: 1 });

const ReminderJob: Model<ReminderJobDocument> =
  mongoose.models.ReminderJob ||
  mongoose.model<ReminderJobDocument>("ReminderJob", ReminderJobSchema);

export default ReminderJob;

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IdempotencyKeyDocument extends Document {
  userId: mongoose.Types.ObjectId;
  scope: string;
  key: string;
  requestHash: string;
  status: "in_progress" | "completed" | "failed";
  responseStatus?: number;
  responseData?: unknown;
  errorMessage?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IdempotencyKeySchema = new Schema<IdempotencyKeyDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    scope: { type: String, required: true, index: true },
    key: { type: String, required: true },
    requestHash: { type: String, required: true },
    status: {
      type: String,
      enum: ["in_progress", "completed", "failed"],
      default: "in_progress",
      index: true,
    },
    responseStatus: { type: Number },
    responseData: { type: Schema.Types.Mixed },
    errorMessage: { type: String },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: true,
    },
  },
  { timestamps: true }
);

IdempotencyKeySchema.index(
  { userId: 1, scope: 1, key: 1 },
  { unique: true, name: "uniq_user_scope_idempotency_key" }
);
IdempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const IdempotencyKey: Model<IdempotencyKeyDocument> =
  mongoose.models.IdempotencyKey ||
  mongoose.model<IdempotencyKeyDocument>("IdempotencyKey", IdempotencyKeySchema);

export default IdempotencyKey;

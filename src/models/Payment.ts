import mongoose, { Schema, Document, Model } from "mongoose";

export interface PaymentDocument extends Document {
  bookingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  method: "cash" | "bank_transfer" | "promptpay";
  status: "pending" | "pending_review" | "completed" | "failed" | "refunded";
  transactionId?: string;
  proofImageUrl?: string;
  proofReference?: string;
  proofSubmittedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNote?: string;
  paidAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<PaymentDocument>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ["cash", "bank_transfer", "promptpay"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "pending_review", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    transactionId: { type: String, sparse: true },
    proofImageUrl: { type: String },
    proofReference: { type: String },
    proofSubmittedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewNote: { type: String },
    paidAt: { type: Date },
    refundedAt: { type: Date },
  },
  { timestamps: true }
);

PaymentSchema.index({ bookingId: 1, status: 1 });

const Payment: Model<PaymentDocument> =
  mongoose.models.Payment || mongoose.model<PaymentDocument>("Payment", PaymentSchema);

export default Payment;

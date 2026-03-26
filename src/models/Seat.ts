import mongoose, { Schema, Document, Model } from "mongoose";

export interface SeatDocument extends Document {
  timeslotId: mongoose.Types.ObjectId;
  seatNumber: number;
  label: string;
  status: "available" | "locked" | "booked";
  lockedBy?: mongoose.Types.ObjectId;
  lockedAt?: Date;
  bookedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SeatSchema = new Schema<SeatDocument>(
  {
    timeslotId: { type: Schema.Types.ObjectId, ref: "Timeslot", required: true, index: true },
    seatNumber: { type: Number, required: true },
    label: { type: String, required: true },
    status: {
      type: String,
      enum: ["available", "locked", "booked"],
      default: "available",
      index: true,
    },
    lockedBy: { type: Schema.Types.ObjectId, ref: "User" },
    lockedAt: { type: Date },
    bookedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

SeatSchema.index({ timeslotId: 1, seatNumber: 1 }, { unique: true });

// Auto-release expired locks
SeatSchema.statics.releaseExpiredLocks = async function (timeoutMs: number) {
  const cutoff = new Date(Date.now() - timeoutMs);
  return this.updateMany(
    { status: "locked", lockedAt: { $lt: cutoff } },
    { $set: { status: "available" }, $unset: { lockedBy: 1, lockedAt: 1 } }
  );
};

const Seat: Model<SeatDocument> =
  mongoose.models.Seat || mongoose.model<SeatDocument>("Seat", SeatSchema);

export default Seat;

import mongoose, { Schema, Document, Model } from "mongoose";

export interface TimeslotDocument extends Document {
  routeId: mongoose.Types.ObjectId;
  date: string;
  time: string;
  totalSeats: number;
  bookedSeats: number;
  status: "active" | "cancelled" | "full";
  createdAt: Date;
  updatedAt: Date;
}

const TimeslotSchema = new Schema<TimeslotDocument>(
  {
    routeId: { type: Schema.Types.ObjectId, ref: "Route", required: true, index: true },
    date: { type: String, required: true, index: true },
    time: { type: String, required: true },
    totalSeats: { type: Number, required: true, min: 1, max: 50 },
    bookedSeats: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["active", "cancelled", "full"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

TimeslotSchema.index({ routeId: 1, date: 1, time: 1 }, { unique: true });

TimeslotSchema.virtual("availableSeats").get(function () {
  return this.totalSeats - this.bookedSeats;
});

TimeslotSchema.set("toJSON", { virtuals: true });
TimeslotSchema.set("toObject", { virtuals: true });

const Timeslot: Model<TimeslotDocument> =
  mongoose.models.Timeslot || mongoose.model<TimeslotDocument>("Timeslot", TimeslotSchema);

export default Timeslot;

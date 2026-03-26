import mongoose, { Schema, Document, Model } from "mongoose";

export interface BookingDocument extends Document {
  userId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  timeslotId: mongoose.Types.ObjectId;
  seatIds: mongoose.Types.ObjectId[];
  passengers: number;
  passengerName: string;
  passengerPhone: string;
  pickupLocation: string;
  status:
    | "pending"
    | "pending_payment"
    | "payment_under_review"
    | "confirmed"
    | "reschedule_requested"
    | "cancelled"
    | "completed";
  paymentId?: mongoose.Types.ObjectId;
  bookingCode?: string;
  sourceChannel?: "web_admin" | "liff" | "line_bot";
  rescheduledFromBookingId?: mongoose.Types.ObjectId;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<BookingDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    routeId: { type: Schema.Types.ObjectId, ref: "Route", required: true },
    timeslotId: { type: Schema.Types.ObjectId, ref: "Timeslot", required: true, index: true },
    seatIds: [{ type: Schema.Types.ObjectId, ref: "Seat" }],
    passengers: { type: Number, required: true, min: 1 },
    passengerName: { type: String, required: true, trim: true },
    passengerPhone: { type: String, required: true, trim: true },
    pickupLocation: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: [
        "pending",
        "pending_payment",
        "payment_under_review",
        "confirmed",
        "reschedule_requested",
        "cancelled",
        "completed",
      ],
      default: "pending",
      index: true,
    },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
    bookingCode: { type: String, unique: true, sparse: true, index: true },
    sourceChannel: {
      type: String,
      enum: ["web_admin", "liff", "line_bot"],
      default: "liff",
      index: true,
    },
    rescheduledFromBookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

BookingSchema.index({ userId: 1, createdAt: -1 });
BookingSchema.index({ timeslotId: 1, status: 1 });

const Booking: Model<BookingDocument> =
  mongoose.models.Booking || mongoose.model<BookingDocument>("Booking", BookingSchema);

export default Booking;

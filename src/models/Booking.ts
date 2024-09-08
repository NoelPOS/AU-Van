import mongoose, { Schema, Document, models, model } from 'mongoose'

export interface BookingDocument extends Document {
  userid: string
  _id: string
  bookingDate: Date
  name: string
  place: string
  phone: string
  persons: number
  createdAt: Date
  updatedAt: Date
}

const BookingSchema: Schema<BookingDocument> = new Schema(
  {
    userid: {
      type: String,
      required: true,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
      required: false,
    },
    name: {
      type: String,
      required: true,
    },
    place: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    persons: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
)

const Booking =
  models.Booking || model<BookingDocument>('Booking', BookingSchema)

export default Booking

import mongoose, { Schema, Document } from 'mongoose'

export interface ITimeSlot {
  time: string
  seats: number
}

const timeSlotSchema: Schema = new Schema({
  time: { type: String, required: true },
  seats: { type: Number, required: true, min: 0 }, // Ensure seats can't be negative
})

const Timeslots =
  mongoose.models.Timeslots ||
  mongoose.model<ITimeSlot>('Timeslots', timeSlotSchema)

export default Timeslots

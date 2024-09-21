import mongoose, { Schema, Document } from 'mongoose'

export interface ITimeSlot {
    time: string
    seats: number
}

export interface IRoute extends Document {
    from: string
    to: string
    timeSlots: ITimeSlot[]
}

const timeSlotSchema: Schema = new Schema({
    time: { type: String, required: true },
    seats: { type: Number, required: true, min: 0 }, // Ensure seats can't be negative
})

const routeSchema: Schema = new Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    timeSlots: { type: [timeSlotSchema], required: true },
})

const RoutesSchema: Schema = new Schema({
    assumption_university_to_mega_bangna: {
        type: routeSchema,
        required: true,
    },
    assumption_university_to_siam_paragon: {
        type: routeSchema,
        required: true,
    },
    mega_bangna_to_assumption_university: {
        type: routeSchema,
        required: true,
    },
    siam_paragon_to_assumption_university: {
        type: routeSchema,
        required: true,
    },
})

const Routes =
    mongoose.models.Routes || mongoose.model<IRoute>('Routes', RoutesSchema)

export default Routes

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/libs/mongodb'
import Booking from '@/models/Booking'
import Timeslots from '@/models/Timeslots'
import { ObjectId } from 'mongodb'

export async function DELETE(req: NextRequest) {
    await connectDB()

    let bookingId
    try {
        const body = await req.json()
        console.log('body:', body)
        // Attempt to parse JSON
        bookingId = body.bookingId
        if (!bookingId) {
            return NextResponse.json(
                { message: 'bookingId is required' },
                { status: 400 }
            )
        }
    } catch (error) {
        return NextResponse.json(
            { message: 'Invalid JSON input', error: (error as Error).message },
            { status: 400 }
        )
    }

    try {
        // Find the booking to get the route and time info
        const booking = await Booking.findById(bookingId)
        if (!booking) {
            return NextResponse.json(
                { message: 'No booking found with the given ID' },
                { status: 404 }
            )
        }

        // Extract the route and time from the booking
        const { route, time, persons } = booking

        const routeField = `${route}.timeSlots`

        // Find the timeslot data
        const timeslotData = await Timeslots.findOne({
            [routeField]: { $elemMatch: { time: time } },
        })

        if (!timeslotData) {
            return NextResponse.json(
                { message: 'No timeslot found for the given route and time' },
                { status: 404 }
            )
        }

        const testing = timeslotData[route].timeSlots.find(
            (slot: { time: string }) => slot.time === time
        )

        console.log('testing:', testing)

        // Update the seat count in the Timeslot collection
        await Timeslots.updateOne(
            { [routeField]: { $elemMatch: { time: time } } },
            { $inc: { [`${routeField}.$.seats`]: persons } }
        )

        // Delete the booking
        const result = await Booking.deleteOne({ _id: bookingId })

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { message: 'No booking found with the given ID' },
                { status: 404 }
            )
        }

        return NextResponse.json({ message: 'Booking deleted successfully' })
    } catch (error: any) {
        console.error('Error deleting booking:', error)
        return NextResponse.json(
            { message: 'Failed to delete booking', error: error.message },
            { status: 500 }
        )
    }
}

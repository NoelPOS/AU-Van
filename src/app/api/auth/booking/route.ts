import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/libs/mongodb'
import Booking, { BookingDocument } from '@/models/Booking'
import Timeslots from '@/models/Timeslots'
import { ObjectId } from 'mongodb'

export async function POST(req: NextRequest) {
    await connectDB()

    try {
        const {
            userid,
            bookingDate,
            name,
            place,
            phone,
            persons,
            time,
            from,
            to,
        } = await req.json()

        // Define the route field to match the route structure in the database
        const route = `${from.toLowerCase().replace(/ /g, '_')}_to_${to
            .toLowerCase()
            .replace(/ /g, '_')}`

        let routeField
        switch (route) {
            case 'assumption_university_to_mega_bangna':
                routeField = 'assumption_university_to_mega_bangna'
                break
            case 'assumption_university_to_siam_paragon':
                routeField = 'assumption_university_to_siam_paragon'
                break
            case 'mega_bangna_to_assumption_university':
                routeField = 'mega_bangna_to_assumption_university'
                break
            case 'siam_paragon_to_assumption_university':
                routeField = 'siam_paragon_to_assumption_university'
                break
            default:
                return NextResponse.json(
                    { error: 'Invalid route provided' },
                    { status: 400 }
                )
        }

        // Use $elemMatch to find the corresponding time slot
        const timeslotData = await Timeslots.findOne({
            [`${routeField}.timeSlots`]: {
                $elemMatch: { time: time },
            },
        })

        if (!timeslotData) {
            return NextResponse.json(
                { error: 'Time slot not found' },
                { status: 404 }
            )
        }

        // Find the specific time slot object in the array
        const timeSlot = timeslotData[routeField].timeSlots.find(
            (slot: any) => slot.time === time
        )

        if (timeSlot.seats < persons) {
            return NextResponse.json(
                { error: 'Not enough seats available' },
                { status: 400 }
            )
        }

        // Deduct seats from the time slot
        const updatedTimeslot = await Timeslots.updateOne(
            {
                [`${routeField}.timeSlots._id`]: timeSlot._id,
            },
            {
                $inc: { [`${routeField}.timeSlots.$.seats`]: -persons },
            }
        )

        // Create a new booking document
        const newBooking: BookingDocument = new Booking({
            userid,
            bookingDate,
            name,
            place,
            phone,
            persons,
            route,
            time,
        })

        // Save the booking to the database
        const savedBooking = await newBooking.save()

        return NextResponse.json({
            message: 'Booking created successfully and seats updated!',
            savedBooking,
        })
    } catch (error) {
        console.error('Booking creation failed:', error)
        return NextResponse.json(
            { error: 'Error creating booking' },
            { status: 500 }
        )
    }
}

export async function GET(req: NextRequest) {
    await connectDB()
    const userid = req.nextUrl.searchParams.get('userid')
    const editid = req.nextUrl.searchParams.get('editid')
    console.log('userid:', userid)

    if (userid) {
        try {
            const bookings = await Booking.find({ userid })
            if (bookings.length === 0) {
                return NextResponse.json(
                    { message: 'No bookings found for this user' },
                    { status: 404 }
                )
            }
            return NextResponse.json(bookings)
        } catch (error) {
            console.error('Error fetching bookings:', error)
            return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            )
        }
    }

    if (editid) {
        try {
            const bookings = await Booking.find({ _id: editid })
            if (bookings.length === 0) {
                return NextResponse.json(
                    { message: 'No bookings found for this this id' },
                    { status: 404 }
                )
            }
            return NextResponse.json(bookings)
        } catch (error) {
            console.error('Error fetching bookings:', error)
            return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            )
        }
    }
}

// DELETE Function - Adjust seats when a booking is deleted
export async function DELETE(req: NextRequest) {
    await connectDB()

    const { userId } = await req.json()

    try {
        // Find the booking to get the route and time info
        const booking = await Booking.findById(userId)
        if (!booking) {
            return NextResponse.json(
                { message: 'No booking found with the given ID' },
                { status: 404 }
            )
        }

        // Extract the route and time from the booking
        const { route, time, persons } = booking
        console.log('Route:', route, 'Time:', time, 'Persons:', persons)

        // Update the seat count in the Timeslot collection
        await Timeslots.updateOne(
            { route, time }, // Match the correct timeslot
            { $inc: { seats: persons } } // Increment the available seats
        )

        // Delete the booking
        const result = await Booking.deleteOne({ _id: new ObjectId(userId) })

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

// PUT (Update) Function - Adjust seats when a booking is updated
export async function PUT(req: NextRequest) {
    await connectDB()

    const { editid, name, place, phone, persons } = await req.json()

    try {
        // Find the existing booking
        const existingBooking = await Booking.findById(editid)
        if (!existingBooking) {
            return NextResponse.json(
                { message: 'Booking not found' },
                { status: 404 }
            )
        }

        const { route, time, persons: oldPersons } = existingBooking

        // Update the booking details
        const updatedBooking = await Booking.findByIdAndUpdate(
            { _id: new ObjectId(editid) },
            { $set: { name, place, phone, persons } },
            { new: true, runValidators: true }
        )

        if (!updatedBooking) {
            return NextResponse.json(
                { message: 'Booking not found' },
                { status: 404 }
            )
        }

        // Adjust the available seats in the Timeslot model based on the persons change
        const personsDiff = oldPersons - persons
        if (personsDiff !== 0) {
            await Timeslots.updateOne(
                { route, time }, // Match the correct timeslot
                { $inc: { seats: personsDiff } } // Adjust available seats accordingly
            )
        }

        return NextResponse.json({ message: 'Booking updated successfully' })
    } catch (error: any) {
        console.error('Error updating booking:', error)
        return NextResponse.json(
            { message: 'Failed to update booking', error: error.message },
            { status: 500 }
        )
    }
}

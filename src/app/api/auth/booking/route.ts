import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/libs/mongodb'
import Booking, { BookingDocument } from '@/models/Booking' // The Booking model we created earlier
import { ObjectId } from 'mongodb'

export async function POST(req: NextRequest) {
    await connectDB()

    try {
        const { userid, bookingId, bookingDate, name, place, phone, persons } =
            await req.json()

        // Validate the incoming data
        if (!userid || !name || !place || !phone || !persons) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Create a new booking document
        const newBooking: BookingDocument = new Booking({
            userid,
            bookingId,
            bookingDate,
            name,
            place,
            phone,
            persons,
        })

        // Save the booking to the database
        const savedBooking = await newBooking.save()

        return NextResponse.json({
            message: 'Booking created successfully!',
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

    // if (!userid) {
    //     return NextResponse.json(
    //         { error: 'Missing required fields' },
    //         { status: 400 }
    //     )
    // }

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

export async function DELETE(req: NextRequest) {
    await connectDB()

    const { userId } = await req.json()

    try {
        // Delete the user by userId
        const result = await Booking.deleteOne({ _id: new ObjectId(userId) })

        // Check if a document was deleted
        if (result.deletedCount === 0) {
            return NextResponse.json(
                { message: 'No user found with the given ID' },
                { status: 404 }
            )
        }

        return NextResponse.json({ message: 'User deleted successfully' })
    } catch (error: any) {
        console.error('Error deleting user:', error)
        return NextResponse.json(
            { message: 'Failed to delete user', error: error.message },
            { status: 500 }
        )
    }
}

export async function PUT(req: NextRequest) {
    await connectDB()

    const { editid, name, place, phone, persons } = await req.json()

    try {
        // Delete the user by userId
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

        return NextResponse.json({ message: 'Update successfully' })
    } catch (error: any) {
        console.error('Error deleting user:', error)
        return NextResponse.json(
            { message: 'Failed to delete user', error: error.message },
            { status: 500 }
        )
    }
}

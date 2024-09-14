import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/libs/mongodb'
import Booking, { BookingDocument } from '@/models/Booking' // The Booking model we created earlier

export async function POST(req: NextRequest) {
    await connectDB()

    try {
        const {
            userid,
            bookingId,
            bookingDate,
            name,
            place,
            phone,
            persons,
            time,
            route,
        } = await req.json()

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
            route,
            time,
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
    console.log('userid:', userid)

    if (!userid) {
        return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
        )
    }

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

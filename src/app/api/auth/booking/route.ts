import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/libs/mongodb'
import Booking, { BookingDocument } from '@/models/Booking' // The Booking model we created earlier

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

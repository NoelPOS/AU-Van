import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/libs/mongodb'
import Booking from '@/models/Booking'

export async function GET(req: NextRequest) {
  try {
    connectDB()
    const res = await Booking.find()
    return NextResponse.json(res)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/libs/mongodb'
import Timeslots from '@/models/Timeslots'

export async function GET(req: NextRequest) {
  await connectDB()

  const from = req.nextUrl.searchParams.get('from')
  const to = req.nextUrl.searchParams.get('to')

  if (!from || !to) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  try {
    const routeField = `${from.toLowerCase().replace(/ /g, '_')}_to_${to
      .toLowerCase()
      .replace(/ /g, '_')}`

    const route = (await Timeslots.findOne(
      {},
      { [routeField]: 1 }
    ).lean()) as Record<string, any>
    if (!route || !route[routeField]) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 })
    }
    return NextResponse.json(route[routeField].timeSlots)
  } catch (error) {
    console.log('Error fetching route times:', error)
    return NextResponse.json(
      { error: 'Failed to fetch route times' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  await connectDB()

  try {
    const { from, to, time, seats } = await req.json()

    if (!from || !to || !time || typeof seats !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields or invalid seat value' },
        { status: 400 }
      )
    }

    // Construct the route field name
    const routeField = `${from.toLowerCase().replace(/ /g, '_')}_to_${to
      .toLowerCase()
      .replace(/ /g, '_')}`

    // Check if the time slot already exists
    const existingRoute = await Timeslots.findOne({
      [`${routeField}.timeSlots`]: { $elemMatch: { time } },
    })

    if (existingRoute) {
      return NextResponse.json(
        { error: 'Time slot already exists for this route' },
        { status: 400 }
      )
    }

    // Add or update the route with new time and seats
    const update = {
      $addToSet: {
        [`${routeField}.timeSlots`]: {
          time,
          seats,
        },
      },
      $set: { [`${routeField}.from`]: from, [`${routeField}.to`]: to },
    }

    // Update or insert the route if it doesn't exist
    const updatedRoute = await Timeslots.findOneAndUpdate({}, update, {
      upsert: true,
      new: true,
    })

    return NextResponse.json({
      message: 'Route updated successfully!',
      updatedRoute,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error updating route.' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  await connectDB()

  const { searchParams } = new URL(req.url)
  const time = searchParams.get('time')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!time || !from || !to) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  // Format the route field by converting from and to into the route key
  const routeField = `${from.toLowerCase().replace(/ /g, '_')}_to_${to
    .toLowerCase()
    .replace(/ /g, '_')}.timeSlots`

  try {
    const result = await Timeslots.updateOne(
      { [routeField]: { $elemMatch: { time } } }, // Find the time slot
      { $pull: { [routeField]: { time } } } // Remove the time slot
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Time slot not found or not deleted' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: 'Time slot deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Error deleting time slot' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  await connectDB()

  try {
    const { route, time, newTime, newNumberOfSeats } = await req.json()

    if (!route || !time || !newTime || typeof newNumberOfSeats !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      )
    }

    let routeField

    // Determine the route field based on the provided route string
    switch (route) {
      case 'assumption_university_to_mega_bangna':
        routeField = 'assumption_university_to_mega_bangna.timeSlots'
        break
      case 'assumption_university_to_siam_paragon':
        routeField = 'assumption_university_to_siam_paragon.timeSlots'
        break
      case 'mega_bangna_to_assumption_university':
        routeField = 'mega_bangna_to_assumption_university.timeSlots'
        break
      case 'siam_paragon_to_assumption_university':
        routeField = 'siam_paragon_to_assumption_university.timeSlots'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid route provided' },
          { status: 400 }
        )
    }

    // Find the specific time slot and update it with the new time and seats
    const result = await Timeslots.updateOne(
      { [`${routeField}.time`]: time }, // Match the existing time
      {
        $set: {
          [`${routeField}.$.time`]: newTime,
          [`${routeField}.$.seats`]: newNumberOfSeats,
        },
      } // Update with new time and seats
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Time slot not found or not updated' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: 'Time slot updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Time slot update failed:', error)
    return NextResponse.json(
      { error: 'Error updating time slot' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import Routes from '@/models/Route'
import { connectDB } from '@/libs/mongodb'

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

    const route = await Routes.findOne({}, { [routeField]: 1 })

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 })
    }

    return NextResponse.json(route)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch route times' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  await connectDB()

  try {
    const { from, to, time } = await req.json()

    if (!from || !to || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Construct the route field name
    const routeField = `${from.toLowerCase().replace(/ /g, '_')}_to_${to
      .toLowerCase()
      .replace(/ /g, '_')}`

    // Update or create the route if it doesn't exist
    const update = {
      $addToSet: {
        [`${routeField}.time`]: {
          $each: Array.isArray(time) ? time : [time],
        },
      },
      $set: { [`${routeField}.from`]: from, [`${routeField}.to`]: to },
    }

    const updatedRoute = await Routes.findOneAndUpdate({}, update, {
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

export async function PUT(req: NextRequest) {
  await connectDB()

  try {
    const { time, route, newTime } = await req.json()

    // Validate the incoming data
    if (!time || !route || !newTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    let routeField

    // Map the route to the corresponding field in the database
    switch (route) {
      case 'assumption_university_to_mega_bangna':
        routeField = 'assumption_university_to_mega_bangna.time'
        break
      case 'assumption_university_to_siam_paragon':
        routeField = 'assumption_university_to_siam_paragon.time'
        break
      case 'mega_bangna_to_assumption_university':
        routeField = 'mega_bangna_to_assumption_university.time'
        break
      case 'siam_paragon_to_assumption_university':
        routeField = 'siam_paragon_to_assumption_university.time'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid route provided' },
          { status: 400 }
        )
    }

    // Update the document in the database, find and update the specific time in the array
    const result = await Routes.updateOne(
      { [routeField]: time }, // Match the current time
      { $set: { [`${routeField}.$`]: newTime } } // Update with newTime
    )

    // Check if the update was successful
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Time not found or route not updated' },
        { status: 404 }
      )
    }

    // Return success response
    return NextResponse.json(
      { success: 'Time updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Time update failed:', error)
    return NextResponse.json({ error: 'Error updating time' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  await connectDB()

  const { searchParams } = new URL(req.url)
  const time = searchParams.get('time')
  const route = searchParams.get('route')

  if (!time || !route) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }
  let routeField

  switch (route) {
    case 'assumption_university_to_mega_bangna':
      routeField = 'assumption_university_to_mega_bangna.time'
      break
    case 'assumption_university_to_siam_paragon':
      routeField = 'assumption_university_to_siam_paragon.time'
      break
    case 'mega_bangna_to_assumption_university':
      routeField = 'mega_bangna_to_assumption_university.time'
      break
    case 'siam_paragon_to_assumption_university':
      routeField = 'siam_paragon_to_assumption_university.time'
      break
    default:
      return NextResponse.json(
        { error: 'Invalid route provided' },
        { status: 400 }
      )
  }
  const result = await Routes.updateOne(
    { [routeField]: time },
    { $pull: { [routeField]: time } }
  )

  if (result.modifiedCount === 0) {
    return NextResponse.json(
      { error: 'Time not found or route not updated' },
      { status: 404 }
    )
  }

  return NextResponse.json(
    { success: 'Time deleted successfully' },
    { status: 200 }
  )
}

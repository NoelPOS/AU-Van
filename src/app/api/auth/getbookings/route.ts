import { NextRequest, NextResponse } from 'next/server'
import Routes from '@/models/Route'
import { connectDB } from '@/libs/mongodb'

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
            return NextResponse.json(
                { error: 'Route not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(route)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch route times' },
            { status: 500 }
        )
    }
}

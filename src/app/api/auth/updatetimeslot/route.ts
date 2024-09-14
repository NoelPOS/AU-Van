import { connectDB } from '@/libs/mongodb'
import Routes from '@/models/Route'
import { NextRequest, NextResponse } from 'next/server'

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
        return NextResponse.json(
            { error: 'Error updating time' },
            { status: 500 }
        )
    }
}

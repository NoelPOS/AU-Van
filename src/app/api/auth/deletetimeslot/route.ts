import { connectDB } from '@/libs/mongodb'
import Routes from '@/models/Route'
import { NextRequest, NextResponse } from 'next/server'

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

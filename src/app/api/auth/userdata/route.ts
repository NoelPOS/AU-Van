import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/libs/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
    await connectDB()
    try {
        const { id } = await req.json() // Parse the JSON body to extract `id`
        const user = await User.findById(id)
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }
        return NextResponse.json(user)
    } catch (error) {
        console.error('User data fetch failed:', error)
        return NextResponse.json(
            { error: 'Error fetching user data' },
            { status: 500 }
        )
    }
}

export async function PUT(req: NextRequest) {
    await connectDB()
    try {
        const { userid, name, email, oldPwd, newPwd } = await req.json()

        // Validate the incoming data
        if (!userid || !name || !email || !oldPwd || !newPwd) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }
        const user = await User.findById(userid)
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        if (bcrypt.compareSync(oldPwd, user.password)) {
            const newPwdHased = bcrypt.hashSync(newPwd, 12)
            const updatedUser = await User.findOneAndUpdate(
                { _id: userid },
                { name, email, password: newPwdHased },
                { new: true }
            )

            return NextResponse.json({
                message: 'User data updated successfully!',
                updatedUser,
            })
        } else {
            return NextResponse.json(
                { error: 'Old password is incorrect' },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('User data update failed:', error)
        return NextResponse.json(
            { error: 'Error updating user data' },
            { status: 500 }
        )
    }
}

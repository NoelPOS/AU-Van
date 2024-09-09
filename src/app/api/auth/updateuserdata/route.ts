import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/libs/mongodb'
import User from '@/models/User'

export async function PUT(req: NextRequest) {
    await connectDB()
    try {
        const { userid, name, email, oldpwd, newpwd } = await req.json()

        // Validate the incoming data
        if (!userid || !name || !email || !oldpwd || !newpwd) {
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
        console.log(user)

        if (oldpwd === user.password) {
            const updatedUser = await User.findOneAndUpdate(
                { _id: userid },
                { name, email, password: newpwd },
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

'use client'

import React, { use, useEffect, useState } from 'react'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import NavBar from '../ui/navbar/navbar'

interface Booking {
    _id: string
    userid: string
    bookingId: string
    bookingDate: Date
    name: string
    place: string
    phone: string
    persons: number
}

export default function MyBookings() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [error, setError] = useState<string | null>(null)
    const userid = useSession().data?.user._id

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const response = await axios.get(
                    `/api/auth/booking?userid=${userid}`
                )
                setBookings(response.data)
            } catch (err) {
                setError('Failed to fetch bookings.')
            }
        }

        fetchBookings()
    }, [userid])

    return (
        <>
            <div className="flex justify-between items-center mb-10">
                <NavBar />
            </div>
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">My Bookings</h1>

                {bookings.length === 0 ? (
                    <p>No bookings found.</p>
                ) : (
                    <table className="min-w-full bg-white border border-gray-300">
                        <thead>
                            <tr>
                                <th className="p-2 border-b">Name</th>
                                <th className="p-2 border-b">Place</th>
                                <th className="p-2 border-b">Phone</th>
                                <th className="p-2 border-b">Persons</th>
                                <th className="p-2 border-b">Booking Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking) => (
                                <tr key={booking._id}>
                                    <td className="p-2 border-b text-center">
                                        {booking.name}
                                    </td>
                                    <td className="p-2 border-b text-center">
                                        {booking.place}
                                    </td>
                                    <td className="p-2 border-b text-center">
                                        {booking.phone}
                                    </td>
                                    <td className="p-2 border-b text-center">
                                        {booking.persons}
                                    </td>
                                    <td className="p-2 border-b text-center">
                                        {new Date(
                                            booking.bookingDate
                                        ).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    )
}

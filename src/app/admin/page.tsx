'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import NavBar from '../ui/navbar/navbar'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CalendarDays, MapPin, Phone, Users, Edit, Trash2 } from 'lucide-react'

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
    const router = useRouter()
    const { data: session, status } = useSession()
    const userid = session?.user._id

    useEffect(() => {
        if (status === 'loading') return // Wait for the session to load

        if (status === 'unauthenticated') {
            router.push('/auth') // Redirect to signin page if not authenticated
            return
        }

        // Only fetch bookings if authenticated
        if (status === 'authenticated' && userid) {
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
        }
    }, [status, userid, router])

    // If still loading, show loading state
    if (status === 'loading') {
        return <div>Loading...</div>
    }

    // If not authenticated, don't render anything (will redirect)
    if (status === 'unauthenticated') {
        return null
    }

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/auth/booking`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: id }),
            })

            if (!response.ok) {
                throw new Error('Failed to delete booking.')
            }

            setBookings((prevBookings) =>
                prevBookings.filter((booking) => booking._id !== id)
            )
        } catch (error) {
            console.error('Error deleting booking:', error)
            setError('Failed to delete booking. Please try again.')
        }
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <NavBar />
            <main className="container mx-auto px-4 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold">
                            My Bookings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div
                                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
                                role="alert"
                            >
                                <p>{error}</p>
                            </div>
                        )}
                        {bookings.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-xl text-gray-600">
                                    No bookings found.
                                </p>
                                <Link href="/routes" passHref>
                                    <Button className="mt-4">Book a Van</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Place</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Persons</TableHead>
                                            <TableHead>Booking Date</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bookings.map((booking) => (
                                            <TableRow key={booking._id}>
                                                <TableCell>
                                                    {booking.name}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                                                        {booking.place}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Phone className="mr-2 h-4 w-4 text-gray-400" />
                                                        {booking.phone}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Users className="mr-2 h-4 w-4 text-gray-400" />
                                                        {booking.persons}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <CalendarDays className="mr-2 h-4 w-4 text-gray-400" />
                                                        {new Date(
                                                            booking.bookingDate
                                                        ).toLocaleDateString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        <Link
                                                            href={`/editbooking/${booking._id}`}
                                                            passHref
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Cancel
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>
                                                                        Are you
                                                                        sure?
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This
                                                                        action
                                                                        cannot
                                                                        be
                                                                        undone.
                                                                        This
                                                                        will
                                                                        permanently
                                                                        delete
                                                                        your
                                                                        booking.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>
                                                                        Cancel
                                                                    </AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() =>
                                                                            handleDelete(
                                                                                booking._id
                                                                            )
                                                                        }
                                                                    >
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}

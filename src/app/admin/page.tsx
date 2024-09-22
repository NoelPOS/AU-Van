'use client'

import { useState, useEffect } from 'react'
import AdminTimeslot from '@/app/ui/admin-timeslot-creation/AdminTimeslot'
import TimeSlot from '../ui/timeslot/timeslotadmin'
import DisplayDate from '../ui/display-date/display-date'
import NavBar from '../ui/navbar/navbar'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlusCircle, Edit, Trash2 } from 'lucide-react'

export default function Dashboard() {
    const [bookings, setBookings] = useState<any[]>([])

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await fetch('/api/auth/getallbookings')
                const data = await res.json()
                setBookings(data)
            } catch (error) {
                console.error('Failed to fetch bookings:', error)
            }
        }
        fetchBookings()
    }, [])

    return (
        <div className="min-h-screen bg-gray-100">
            <NavBar />
            <div className="container mx-auto px-4 py-8">
                <div className="grid gap-8 md:grid-cols-3">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <DisplayDate />
                            <CardTitle className="text-2xl font-bold">
                                Welcome back, Admin!
                            </CardTitle>
                            <CardDescription>
                                Here&#39;s what&#39;s happening with your
                                business today
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        New Timeslot
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <AdminTimeslot />
                                </DialogContent>
                            </Dialog>
                        </CardFooter>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold">
                                        {bookings.length}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Total Bookings
                                    </p>
                                </div>
                                {/* Add more stats here */}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8">
                    <Tabs defaultValue="bookings" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="bookings">
                                Today&#39;s Bookings
                            </TabsTrigger>
                            <TabsTrigger value="timeslots">
                                Timeslots
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="bookings">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Bookings</CardTitle>
                                    <CardDescription>
                                        Your bookings for today
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        Customer
                                                    </TableHead>
                                                    <TableHead className="hidden sm:table-cell">
                                                        Pick-Up
                                                    </TableHead>
                                                    <TableHead className="hidden sm:table-cell">
                                                        People
                                                    </TableHead>
                                                    <TableHead className="hidden md:table-cell">
                                                        Time
                                                    </TableHead>
                                                    <TableHead className="hidden md:table-cell">
                                                        Route
                                                    </TableHead>
                                                    <TableHead>Phone</TableHead>
                                                    <TableHead>
                                                        Actions
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {bookings.map(
                                                    (booking, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell className="font-medium">
                                                                {booking.name}
                                                            </TableCell>
                                                            <TableCell className="hidden sm:table-cell">
                                                                {booking.place}
                                                            </TableCell>
                                                            <TableCell className="hidden sm:table-cell">
                                                                {
                                                                    booking.persons
                                                                }
                                                            </TableCell>
                                                            <TableCell className="hidden md:table-cell">
                                                                {booking.time}
                                                            </TableCell>
                                                            <TableCell className="hidden md:table-cell">
                                                                {booking.route}
                                                            </TableCell>
                                                            <TableCell>
                                                                {booking.phone}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex space-x-2">
                                                                    <Dialog>
                                                                        <DialogTrigger
                                                                            asChild
                                                                        >
                                                                            <Button
                                                                                variant="outline"
                                                                                size="icon"
                                                                            >
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                        </DialogTrigger>
                                                                        <DialogContent>
                                                                            <DialogHeader>
                                                                                <DialogTitle>
                                                                                    Edit
                                                                                    Booking
                                                                                </DialogTitle>
                                                                            </DialogHeader>
                                                                            <DialogDescription>
                                                                                Edit
                                                                                the
                                                                                booking
                                                                                details
                                                                                below
                                                                            </DialogDescription>
                                                                            {/* Add form fields here */}
                                                                            <DialogFooter>
                                                                                <Button>
                                                                                    Save
                                                                                    Changes
                                                                                </Button>
                                                                            </DialogFooter>
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                    <Dialog>
                                                                        <DialogTrigger
                                                                            asChild
                                                                        >
                                                                            <Button
                                                                                variant="outline"
                                                                                size="icon"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </DialogTrigger>
                                                                        <DialogContent>
                                                                            <DialogHeader>
                                                                                <DialogTitle>
                                                                                    Delete
                                                                                    Booking
                                                                                </DialogTitle>
                                                                            </DialogHeader>
                                                                            <DialogDescription>
                                                                                Are
                                                                                you
                                                                                sure
                                                                                you
                                                                                want
                                                                                to
                                                                                delete
                                                                                this
                                                                                booking?
                                                                            </DialogDescription>
                                                                            <DialogFooter>
                                                                                <Button variant="destructive">
                                                                                    Delete
                                                                                </Button>
                                                                                <Button variant="outline">
                                                                                    Cancel
                                                                                </Button>
                                                                            </DialogFooter>
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="timeslots">
                            <div className="grid gap-4 md:grid-cols-2">
                                <TimeSlot
                                    from="Siam Paragon"
                                    to="Assumption University"
                                />
                                <TimeSlot
                                    from="Assumption University"
                                    to="Siam Paragon"
                                />
                                <TimeSlot
                                    from="Assumption University"
                                    to="Mega Bangna"
                                />
                                <TimeSlot
                                    from="Mega Bangna"
                                    to="Assumption University"
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}

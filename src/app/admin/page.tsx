'use client'
import { useState, useEffect } from 'react'
import AdminTimeslot from '@/app/ui/admin-timeslot-creation/AdminTimeslot'
import TimeSlot from '../ui/timeslot/timeslotadmin'
import DisplayDate from '../ui/display-date/display-date'
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

export const description =
    'An orders dashboard with a sidebar navigation. The sidebar has icon navigation. The content area has a breadcrumb and search in the header. The main area has a list of recent orders with a filter and export button. The main area also has a detailed view of a single order with order details, shipping information, billing information, customer information, and payment information.'

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
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                <main className="flex flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8  lg:grid-cols-2 xl:grid-cols-2">
                    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                            <Card
                                className="sm:col-span-2"
                                x-chunk="dashboard-05-chunk-0"
                            >
                                <CardHeader className="pb-3">
                                    <DisplayDate />
                                    <CardTitle>Welcome back Admin!</CardTitle>
                                    <CardDescription className="max-w-lg text-balance leading-relaxed">
                                        Here's what's happening with your
                                        business today
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline">
                                                New Timeslot
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <AdminTimeslot />
                                        </DialogContent>
                                    </Dialog>
                                </CardFooter>
                            </Card>
                        </div>
                        <Tabs defaultValue="week">
                            <div className="flex items-center">
                                <TabsList>
                                    <TabsTrigger value="week">
                                        Today's Bookings
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                            <TabsContent value="week">
                                <Card x-chunk="dashboard-05-chunk-3">
                                    <CardHeader className="px-7">
                                        <CardTitle>Bookings</CardTitle>
                                        <CardDescription>
                                            Your bookings for today
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
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
                                                    <TableHead className="text-right">
                                                        Phone
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {bookings.map((booking) => (
                                                    <TableRow className="bg-accent">
                                                        <TableCell>
                                                            <div className="font-medium">
                                                                {booking.name}
                                                            </div>
                                                            {/* <div className="hidden text-sm text-muted-foreground md:inline">
                                                                noel@gmail.com
                                                            </div> */}
                                                        </TableCell>
                                                        <TableCell className="hidden sm:table-cell">
                                                            {booking.place}
                                                        </TableCell>
                                                        <TableCell className="hidden sm:table-cell">
                                                            {booking.persons}
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">
                                                            {booking.time}
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">
                                                            {booking.route}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {booking.phone}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Dialog>
                                                                <DialogTrigger
                                                                    asChild
                                                                >
                                                                    <Button variant="outline">
                                                                        Edit
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>
                                                                            Edit
                                                                            Booking
                                                                        </DialogTitle>
                                                                    </DialogHeader>
                                                                    <DialogContent>
                                                                        <DialogDescription>
                                                                            Edit
                                                                            the
                                                                            booking
                                                                            details
                                                                            below
                                                                        </DialogDescription>
                                                                    </DialogContent>
                                                                    <DialogFooter>
                                                                        <Button>
                                                                            Save
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                            <Dialog>
                                                                <DialogTrigger
                                                                    asChild
                                                                >
                                                                    <Button variant="outline">
                                                                        Delete
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>
                                                                            Delete
                                                                            Booking
                                                                        </DialogTitle>
                                                                    </DialogHeader>
                                                                    <DialogContent>
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
                                                                    </DialogContent>
                                                                    <DialogFooter>
                                                                        <Button>
                                                                            Yes
                                                                        </Button>
                                                                        <Button variant="outline">
                                                                            No
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                    <div className="flex flex-col gap-5">
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
                </main>
            </div>
        </div>
    )
}

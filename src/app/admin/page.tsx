'use client'

import { useState, useEffect } from 'react'
import AdminTimeslot from '@/app/ui/admin-timeslot-creation/AdminTimeslot'
import TimeSlot from '../ui/timeslot/timeslotadmin'
import DisplayDate from '../ui/display-date/display-date'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/auth/booking/deletebyid`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId: id }),
      })
      setBookings(bookings.filter((booking) => booking._id !== id))
      router.refresh()
      alert('Booking deleted successfully')
    } catch (error) {
      console.error('Failed to delete booking:', error)
    }
  }

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
    <div className="min-h-calc[100vh-4rem] ">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <DisplayDate />
              <CardTitle className="text2xl font-bold">
                Welcome back, Admin!
              </CardTitle>
              <CardDescription>
                Here&#39;s what&#39;s happening with your business today
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
                  <p className="text-2xl font-bold">{bookings.length}</p>
                  <p className="text-sm text-gray-500">Total Bookings</p>
                </div>
                {/* Add more stats here */}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="bookings">Today&#39;s Bookings</TabsTrigger>
              <TabsTrigger value="timeslots">Timeslots</TabsTrigger>
            </TabsList>
            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>Bookings</CardTitle>
                  <CardDescription>Your bookings for today</CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className='text-center'>Customer</TableHead>
                            <TableHead className="hidden sm:table-cell">
                              Pick-Up
                            </TableHead>
                            <TableHead className="hidden sm:table-cell text-center">
                              People
                            </TableHead>
                            <TableHead className="hidden md:table-cell text-center">
                              Time
                            </TableHead>
                            <TableHead className="hidden md:table-cell text-center">
                              Route
                            </TableHead>
                            <TableHead className='text-center'>Phone</TableHead>
                            <TableHead className='text-center'>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bookings.map((booking, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium text-center">
                                {booking.name}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-center">
                                {booking.place}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-center">
                                {booking.persons}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-center">
                                {booking.time}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-center">
                                {booking.route}
                              </TableCell>
                              <TableCell className='text-center'>{booking.phone}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2 justify-center">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="icon">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>
                                          Delete Booking
                                        </DialogTitle>
                                      </DialogHeader>
                                      <DialogDescription>
                                        Are you sure you want to delete this
                                        booking?
                                      </DialogDescription>
                                      <DialogFooter>
                                        <Button
                                          onClick={() => {
                                            handleDelete(booking._id)
                                          }}
                                          variant="destructive"
                                        >
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
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-lg text-gray-500">
                        No bookings for today.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="timeslots">
              <div className="grid gap-4 md:grid-cols-2">
                <TimeSlot from="Siam Paragon" to="Assumption University" />
                <TimeSlot from="Assumption University" to="Siam Paragon" />
                <TimeSlot from="Assumption University" to="Mega Bangna" />
                <TimeSlot from="Mega Bangna" to="Assumption University" />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

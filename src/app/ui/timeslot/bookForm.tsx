'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import DisplayDate from '@/app/ui/display-date/display-date'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { useSearchParams } from 'next/navigation'
import { User, MapPin, Phone, Users, Calendar, Clock } from 'lucide-react'
import { Suspense } from 'react'

export default function BookFormPage({
    date,
    isEdit,
}: {
    date: Date
    isEdit: { edit: boolean; id: any }
}) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BookForm date={date} isEdit={isEdit} />
        </Suspense>
    )
}

function BookForm({
    date,
    isEdit,
}: {
    date: Date
    isEdit: { edit: boolean; id: any }
}) {
    const searchParams = useSearchParams()
    const time = searchParams.get('time')
    const fromm = searchParams.get('from')
    const too = searchParams.get('to')

    const { data } = useSession()
    const [name, setName] = useState<string>('')
    const [place, setPlace] = useState<string>('')
    const [phone, setPhone] = useState<string>('')
    const [persons, setPersons] = useState<number>(1)
    const [editData, setEditData] = useState<any>()

    const router = useRouter()

    useEffect(() => {
        const fetchData = async () => {
            if (isEdit.edit) {
                try {
                    const response = await fetch(
                        `/api/auth/booking?editid=${encodeURIComponent(isEdit.id)}`,
                        {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        }
                    )

                    if (!response.ok) {
                        throw new Error(`Error: ${response.statusText}`)
                    }

                    const data = await response.json()
                    setEditData(data[0])
                    setName(data[0].name)
                    setPhone(data[0].phone)
                    setPlace(data[0].place)
                    setPersons(data[0].persons)
                } catch (error) {
                    console.error('Failed to fetch booking data:', error)
                }
            }
        }

        fetchData()
    }, [isEdit])

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const bookingData = {
            userid: data?.user._id,
            name,
            place,
            phone,
            persons,
            bookingDate: date,
            from: fromm,
            to: too,
            time,
        }

        try {
            const response = await axios.post('/api/auth/booking', bookingData)
            alert(response.data.message)
            router.push('/mybookings')
        } catch (error) {
            console.error('An error occurred while booking:', error)
        }
    }

    const handleEditSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault()

        const bookingData = {
            editid: editData?._id,
            name,
            place,
            phone,
            persons,
        }

        try {
            const response = await axios.put('/api/auth/booking', bookingData)

            alert(response.data.message)
            router.back()
        } catch (error) {
            console.error('An error occurred while booking:', error)
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                    {isEdit.edit ? 'Edit Booking' : 'Book Your Ride'}
                </CardTitle>
                <CardDescription className="text-center">
                    <DisplayDate />
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={isEdit.edit ? handleEditSubmit : handleSubmit}
                    className="space-y-4"
                >
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="name"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="place">Place</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="place"
                                placeholder="Enter your apartment name"
                                value={place}
                                onChange={(e) => setPlace(e.target.value)}
                                required
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="phone"
                                placeholder="+66912873212"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="persons">Persons</Label>
                        <div className="relative">
                            <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="persons"
                                placeholder="Enter number of persons"
                                type="number"
                                value={persons}
                                onChange={(e) =>
                                    setPersons(Number(e.target.value))
                                }
                                required
                                min={1}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    {!isEdit.edit && (
                        <div className="space-y-2">
                            <Label>Booking Details</Label>
                            <div className="bg-gray-100 p-4 rounded-md space-y-2">
                                <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                    <span className="text-sm text-gray-600">
                                        {date.toDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                    <span className="text-sm text-gray-600">
                                        {time}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                                    <span className="text-sm text-gray-600">
                                        {fromm} to {too}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    <CardFooter className="flex justify-between px-0 pt-4">
                        <Link href="/mybookings">
                            <Button variant="outline">Cancel</Button>
                        </Link>
                        <Button type="submit">
                            {isEdit.edit ? 'Update Booking' : 'Confirm Booking'}
                        </Button>
                    </CardFooter>
                </form>
            </CardContent>
        </Card>
    )
}

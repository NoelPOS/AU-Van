'use client'

import React, { useState, useEffect } from 'react'
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import DisplayDate from '@/app/ui/display-date/display-date'
import Link from 'next/link'
import axios from 'axios'
import { useSearchParams, useRouter } from 'next/navigation'
import { Clock, MapPin, Users } from 'lucide-react'
import { Suspense } from 'react'

export default function TimeslotPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TimeslotAdmin />
        </Suspense>
    )
}

function TimeslotAdmin() {
    const router = useRouter()
    const params = useSearchParams()
    const time = params.get('time')
    const route = params.get('route')
    const from = params.get('from')
    const to = params.get('to')

    const [usableTimes, setUsableTimes] = React.useState<string[]>([
        '10:00',
        '11:00',
        '12:00',
        '13:00',
        '14:00',
        '15:00',
        '16:00',
        '17:00',
        '18:00',
        '19:00',
        '20:00',
        '21:00',
        '22:00',
        '23:00',
        '00:00',
        '01:00',
        '02:00',
        '03:00',
        '04:00',
        '05:00',
        '06:00',
        '07:00',
        '08:00',
        '09:00',
    ])
    const [newTime, setNewTime] = React.useState<string>('')
    const [newNumberOfSeats, setNewNumberOfSeats] = React.useState<number>(0)

    const handleUpdate = async () => {
        try {
            const data = {
                time,
                route,
                newTime,
                newNumberOfSeats,
            }
            const res = await axios.put('/api/auth/routes', data)
            console.log(res.data)
            alert('Time slot updated successfully')
            router.back()
        } catch (error) {
            console.error('Failed to update booking:', error)
        }
    }

    const handleDelete = async () => {
        try {
            const res = await axios.delete(
                `/api/auth/routes?time=${time}&from=${from}&to=${to}`
            )
            console.log(res.data)
            router.back()
            alert('Time slot deleted successfully')
        } catch (error) {
            console.error('Failed to delete booking:', error)
        }
    }

    function TIMEhandleValueChange(value: string): void {
        setNewTime(value)
    }

    useEffect(() => {
        const indexObject = `${from?.toLowerCase().split(' ').join('_')}_to_${to
            ?.toLowerCase()
            .split(' ')
            .join('_')}`

        const fetchTimes = async () => {
            try {
                const res = await fetch(
                    `/api/auth/timeslot?from=${from}&to=${to}`
                )
                const data = await res.json()

                if (data[indexObject]?.time) {
                    console.log(data[indexObject].time)
                    const filteredTimes = usableTimes.filter(
                        (time) => !data[indexObject].time.includes(time)
                    )
                    setUsableTimes(() => filteredTimes)
                    console.log(usableTimes)
                } else {
                    setUsableTimes([]) // No times found
                }
            } catch (error) {
                console.error('Failed to fetch times:', error)
            }
        }

        fetchTimes()
    }, [])

    return (
        <Card className="w-full max-w-2xl mx-auto mt-8 shadow-lg">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                    Timeslot Management
                </CardTitle>
                <CardDescription className="text-center">
                    <DisplayDate />
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="route">Route</Label>
                        <div className="flex items-center space-x-2 rounded-md border p-2">
                            <MapPin className="h-4 w-4 opacity-70" />
                            <Input
                                id="route"
                                value={route ?? ''}
                                readOnly
                                className="border-0 p-0"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="currenttime">Current Time</Label>
                        <div className="flex items-center space-x-2 rounded-md border p-2">
                            <Clock className="h-4 w-4 opacity-70" />
                            <Input
                                id="currenttime"
                                value={time ?? ''}
                                readOnly
                                className="border-0 p-0"
                            />
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="newtime">New Time</Label>
                    <Select
                        value={newTime}
                        onValueChange={TIMEhandleValueChange}
                    >
                        <SelectTrigger id="newtime" className="w-full">
                            <SelectValue placeholder="Choose New Time" />
                        </SelectTrigger>
                        <SelectContent>
                            {usableTimes.map((each: string) => (
                                <SelectItem key={each} value={each}>
                                    {each}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="newseats">New Number of Seats</Label>
                    <div className="flex items-center space-x-2 rounded-md border p-2">
                        <Users className="h-4 w-4 opacity-70" />
                        <Input
                            id="newseats"
                            type="number"
                            placeholder="Enter new number of seats"
                            value={newNumberOfSeats || ''}
                            onChange={(e) =>
                                setNewNumberOfSeats(Number(e.target.value))
                            }
                            className="border-0 p-0"
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Link href="/admin">
                    <Button variant="outline">Cancel</Button>
                </Link>
                <div className="space-x-2">
                    <Button variant="destructive" onClick={handleDelete}>
                        Delete
                    </Button>
                    <Button onClick={handleUpdate}>Update</Button>
                </div>
            </CardFooter>
        </Card>
    )
}

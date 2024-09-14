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

export default function TimeslotAdmin() {
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

    const handleUpdate = async () => {
        try {
            const data = {
                time,
                route,
                newTime,
            }
            const res = await axios.put('/api/auth/timeslot', data)
            console.log(res.data)
            router.push('/admin')
            alert('Time slot updated successfully')
        } catch (error) {
            console.error('Failed to update booking:', error)
        }
    }

    const handleDelete = async () => {
        try {
            const res = await axios.delete(
                `/api/auth/timeslot?time=${time}&route=${route}`
            )
            console.log(res.data)
            router.push('/admin')
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
        <Card className="lg:w-[50%]  md:w-[450px]  mx-auto mt-5 sm:w-[300px]">
            <CardHeader>
                <CardTitle>
                    <DisplayDate />
                </CardTitle>
                <CardDescription>
                    You can delete or update the time slot
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex items-center gap-4">
                            <Label className="w-16" htmlFor="route">
                                Route
                            </Label>
                            <Input id="route" value={route ?? ''} />
                        </div>
                        <div className="flex items-center gap-4">
                            <Label className="w-16" htmlFor="currenttime">
                                Current Time
                            </Label>
                            <Input
                                id="currenttime"
                                value={time ?? ''}
                                required
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Label className="w-16" htmlFor="newtime">
                                New Time
                            </Label>

                            <Select
                                value={newTime}
                                onValueChange={TIMEhandleValueChange}
                            >
                                <SelectTrigger className="lg:w-[200px] w-[150px]">
                                    <SelectValue placeholder="Choose New Time" />
                                </SelectTrigger>
                                <SelectContent>
                                    {usableTimes.map((each: string) => {
                                        return (
                                            <SelectItem key={each} value={each}>
                                                {each}
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <CardFooter className="flex justify-between mt-7">
                        <Link href="/admin">
                            <Button variant="outline">Cancel</Button>
                        </Link>
                        <div className="flex gap-2">
                            <Button onClick={handleDelete}>Delete</Button>
                            <Button onClick={handleUpdate}>Update</Button>
                        </div>
                    </CardFooter>
                </div>
            </CardContent>
        </Card>
    )
}

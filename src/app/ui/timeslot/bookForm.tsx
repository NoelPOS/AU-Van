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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import DisplayDate from '@/app/ui/display-date/display-date'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'

export default function BookForm({
    date,
    isEdit,
}: {
    date: Date
    isEdit: { edit: boolean; id: any }
}) {
    const { data } = useSession()
    const [name, setName] = useState<string>('')
    const [place, setPlace] = useState<string>('')
    const [phone, setPhone] = useState<string>('')
    const [persons, setPersons] = useState<number>(1)
    const [payment, setPayment] = useState<string>('cash')

    const [editData, setEditData] = useState<any>()

    useEffect(() => {
        const fetchData = async () => {
            if (isEdit) {
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

    const router = useRouter()

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const bookingData = {
            userid: data?.user._id,
            name,
            place,
            phone,
            persons,
            bookingDate: date,
            route: `${fromm}-${too}`,
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
            router.push('/')
        } catch (error) {
            console.error('An error occurred while booking:', error)
        }
    }

    return (
        <Card className="w-[450px]">
            <CardHeader>
                <CardTitle>
                    <DisplayDate />
                </CardTitle>
                <CardDescription>
                    If you entered the wrong phone number, the driver will be
                    unable to pick you up.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={isEdit.edit ? handleEditSubmit : handleSubmit}>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex items-center gap-4">
                            <Label className="w-16" htmlFor="name">
                                Name
                            </Label>
                            <Input
                                id="name"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Label className="w-16" htmlFor="place">
                                Place
                            </Label>
                            <Input
                                id="place"
                                placeholder="Enter your apartment name"
                                value={place}
                                onChange={(e) => setPlace(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Label className="w-16" htmlFor="phone">
                                Phone
                            </Label>
                            <Input
                                id="phone"
                                placeholder="+66912873212"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Label className="w-16" htmlFor="persons">
                                Person
                            </Label>
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
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Label className="w-16" htmlFor="payment">
                                Payment
                            </Label>
                            <RadioGroup
                                className="flex"
                                value={payment}
                                onValueChange={(value) => setPayment(value)}
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="cash" id="cash" />
                                    <Label htmlFor="cash">Cash</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="transfer"
                                        id="transfer"
                                    />
                                    <Label htmlFor="transfer">Transfer</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                    <CardFooter className="flex justify-between mt-7">
                        <Link href="/routes">
                            <Button variant="outline">Cancel</Button>
                        </Link>
                        <Button type="submit">
                            {isEdit.edit ? 'Update' : 'Book'}
                        </Button>
                    </CardFooter>
                </form>
            </CardContent>
        </Card>
    )
}

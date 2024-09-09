'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

import TimeSlot from '@/app/ui/timeslot/timeslot'
import { Button } from '@/components/ui/button'

const times = [
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
]

export default function Admin() {
    const data = {
        assumption_university: ['Siam Paragon', 'Mega Bangna'],
        siam_paragon: ['Assumption University'],
        mega_bangna: ['Assumption University'],
    }
    const [from, setFrom] = useState<string>('')
    const [to, setTo] = useState<string>('')
    const [selectedFROM, setSelectedFROM] = useState<boolean>(false)
    const [time, setTime] = useState<string>('')

    function FROMhandleValueChange(value: string): void {
        setFrom(value)
        setSelectedFROM(true)
        setTo('')
    }

    function TOhandleValueChange(value: string): void {
        setTo(value)
    }

    function TIMEhandleValueChange(value: string): void {
        setTime(value)
    }

    function toTitleCase(str: string) {
        return str
            .split('_')
            .join(' ')
            .replace(
                /\w\S*/g,
                (text) =>
                    text.charAt(0).toUpperCase() +
                    text.substring(1).toLowerCase()
            )
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        try {
            const response = await axios.post('/api/auth/getbookings', {
                from,
                to,
                time: [time],
            })
            alert(response.data.message)
        } catch (error) {
            console.log(error)
            alert('Error adding route')
        }
    }

    return (
        <>
            <form
                onSubmit={handleSubmit}
                className="flex-col justify-center items-center gap-5"
            >
                <label> From: </label>
                <Select value={from} onValueChange={FROMhandleValueChange}>
                    <SelectTrigger className="lg:w-[200px] w-[150px]">
                        <SelectValue placeholder="From" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.keys(data).map((each) => {
                            return (
                                <SelectItem
                                    key={each}
                                    value={toTitleCase(each)}
                                >
                                    {toTitleCase(each)}
                                </SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>
                <label> To: </label>
                <Select
                    disabled={!selectedFROM}
                    value={to}
                    onValueChange={TOhandleValueChange}
                >
                    <SelectTrigger className="lg:w-[200px] w-[150px]">
                        <SelectValue placeholder="To" />
                    </SelectTrigger>
                    <SelectContent>
                        {data[
                            from
                                .toLowerCase()
                                .split(' ')
                                .join('_') as keyof typeof data
                        ]?.map((each: string) => {
                            return (
                                <SelectItem key={each} value={each}>
                                    {each}
                                </SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>
                <label> Time: </label>
                <Select onValueChange={TIMEhandleValueChange}>
                    <SelectTrigger className="lg:w-[200px] w-[150px]">
                        <SelectValue placeholder="Time" />
                    </SelectTrigger>
                    <SelectContent>
                        {times.map((each: string) => {
                            return (
                                <SelectItem key={each} value={each}>
                                    {each}
                                </SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>
                <Button type="submit">Submit</Button>
            </form>
        </>
    )
}

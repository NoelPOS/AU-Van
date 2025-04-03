'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Clock, MapPin, Users } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

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

const data = {
  assumption_university: ['Siam Paragon', 'Mega Bangna'],
  siam_paragon: ['Assumption University'],
  mega_bangna: ['Assumption University'],
}

export default function Admin() {
  const router = useRouter()
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [selectedFROM, setSelectedFROM] = useState<boolean>(false)
  const [time, setTime] = useState<string>('')
  const [seats, setSeats] = useState<number>(0)

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
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const response = await axios.post('/api/auth/routes', {
        from,
        to,
        time,
        seats,
      })
      router.push('/admin/timeslot')
      alert(response.data.message)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Create Timeslot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Select value={from} onValueChange={FROMhandleValueChange}>
              <SelectTrigger id="from" className="w-full">
                <MapPin className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select departure" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(data).map((each) => (
                  <SelectItem key={each} value={toTitleCase(each)}>
                    {toTitleCase(each)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Select
              disabled={!selectedFROM}
              value={to}
              onValueChange={TOhandleValueChange}
            >
              <SelectTrigger id="to" className="w-full">
                <MapPin className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {data[
                  from.toLowerCase().split(' ').join('_') as keyof typeof data
                ]?.map((each: string) => (
                  <SelectItem key={each} value={each}>
                    {each}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Select value={time} onValueChange={TIMEhandleValueChange}>
              <SelectTrigger id="time" className="w-full">
                <Clock className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {times.map((each: string) => (
                  <SelectItem key={each} value={each}>
                    {each}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seats">Number of Seats</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="seats"
                type="number"
                placeholder="Enter number of seats"
                className="pl-10"
                value={seats || ''}
                onChange={(event) => setSeats(Number(event.target.value))}
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Create Timeslot
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

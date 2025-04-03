'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import TimeSlot from '@/app/ui/timeslot/timeslot'
import { ArrowRight, MapPin } from 'lucide-react'

export default function DestinationSelection() {
  const data = {
    assumption_university: ['Siam Paragon', 'Mega Bangna'],
    siam_paragon: ['Assumption University'],
    mega_bangna: ['Assumption University'],
  }
  const [from, setFrom] = useState<string>('Assumption University')
  const [to, setTo] = useState<string>('Siam Paragon')
  const [selectedFROM, setSelectedFROM] = useState<boolean>(true)

  function FROMhandleValueChange(value: string): void {
    setFrom(value)
    setSelectedFROM(true)
    setTo('')
  }

  function TOhandleValueChange(value: string): void {
    setTo(value)
  }

  function toTitleCase(str: string) {
    return str
      .split('_')
      .join(' ')
      .replace(
        /\w\S*/g,
        (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
      )
  }

  return (
    <div className="min-h-calc[100vh-4rem] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">
              Choose Your Destination
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-center items-center gap-5 mb-8">
              <div className="w-full md:w-auto">
                <label
                  htmlFor="from-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  From
                </label>
                <Select value={from} onValueChange={FROMhandleValueChange}>
                  <SelectTrigger
                    id="from-select"
                    className="w-full md:w-[200px]"
                  >
                    <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="From" />
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
              <ArrowRight className="hidden md:block h-6 w-6 text-gray-400" />
              <div className="w-full md:w-auto">
                <label
                  htmlFor="to-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  To
                </label>
                <Select
                  disabled={!selectedFROM}
                  value={to}
                  onValueChange={TOhandleValueChange}
                >
                  <SelectTrigger id="to-select" className="w-full md:w-[200px]">
                    <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="To" />
                  </SelectTrigger>
                  <SelectContent>
                    {data[
                      from
                        .toLowerCase()
                        .split(' ')
                        .join('_') as keyof typeof data
                    ]?.map((each: string) => (
                      <SelectItem key={each} value={each}>
                        {each}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {from && to && (
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 text-center">
                  Available Time Slots
                </h2>
                <TimeSlot from={from} to={to} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

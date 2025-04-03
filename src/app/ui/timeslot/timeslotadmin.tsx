'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Clock, Users } from 'lucide-react'

export default function TimeSlot({ from, to }: { from: string; to: string }) {
  const [times, setTimes] = useState<any[]>([])
  const [hasBothChanged, setHasBothChanged] = useState(false)

  useEffect(() => {
    if (from !== 'Assumption University' && to !== 'Mega Bangna') {
      setHasBothChanged(true)
    }
  }, [from, to])

  useEffect(() => {
    const indexObject = `${from.toLowerCase().split(' ').join('_')}_to_${to
      .toLowerCase()
      .split(' ')
      .join('_')}`

    const fetchTimes = async () => {
      try {
        const res = await fetch(`/api/auth/routes?from=${from}&to=${to}`)
        const data = await res.json()

        if (data) {
          setTimes(data)
        } else {
          setTimes([])
        }
      } catch (error) {
        console.error('Failed to fetch times:', error)
      }
    }

    fetchTimes()
  }, [from, to, hasBothChanged])

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-xl text-center">
          <span className="text-yellow-500">{from}</span>
          <span className="mx-2">&rarr;</span>
          <span className="text-rose-500">{to}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {times.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center">
            {times.map((time, index) => (
              <Link
                key={index}
                href={{
                  pathname: 'admin/timeslotform',
                  query: {
                    time: time.time,
                    route: `${from.toLowerCase().split(' ').join('_')}_to_${to
                      .toLowerCase()
                      .split(' ')
                      .join('_')}`,
                    from: from,
                    to: to,
                  },
                }}
                className="block"
              >
                <Button
                  variant="outline"
                  className="w-full h-auto py-2 flex flex-col items-center justify-center gap-2"
                >
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{time.time}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{time.seats} seats</span>
                  </div>
                </Button>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            No available times for this route.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

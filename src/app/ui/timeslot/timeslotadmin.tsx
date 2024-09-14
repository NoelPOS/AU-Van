'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function TimeSlot({ from, to }: { from: string; to: string }) {
    const [times, setTimes] = useState<string[]>([])
    const [hasBothChanged, setHasBothChanged] = useState(false)

    useEffect(() => {
        // Check if both `from` and `to` have been set to non-default values
        if (from !== 'Assumption University' && to !== 'Mega Bangna') {
            setHasBothChanged(true) // Mark that both have been changed
        }
    }, [from, to])

    useEffect(() => {
        const indexObject = `${from.toLowerCase().split(' ').join('_')}_to_${to
            .toLowerCase()
            .split(' ')
            .join('_')}`

        const fetchTimes = async () => {
            try {
                const res = await fetch(
                    `/api/auth/timeslot?from=${from}&to=${to}`
                )
                const data = await res.json()

                if (data[indexObject]?.time) {
                    setTimes(data[indexObject].time)
                } else {
                    setTimes([]) // No times found
                }
            } catch (error) {
                console.error('Failed to fetch times:', error)
            }
        }

        fetchTimes()
    }, [from, to, hasBothChanged])

    return (
        <>
            <Card className="flex flex-col gap-5 p-6 w-fullmx-auto">
                <h4 className="text-xl">
                    <span className="text-yellow-500">{from}</span> &rarr;{' '}
                    <span className="text-rose-500">{to}</span>
                </h4>
                <div className="mx-auto flex items-center justify-center gap-4 flex-wrap">
                    {times.length > 0 ? (
                        times.map((time, index) => (
                            <Link
                                key={index}
                                href={{
                                    pathname: 'admin/timeslotform',
                                    query: {
                                        time: time,
                                        route: `${from.toLowerCase().split(' ').join('_')}_to_${to
                                            .toLowerCase()
                                            .split(' ')
                                            .join('_')}`,
                                        from: from,
                                        to: to,
                                    },
                                }}
                            >
                                <Button className="my-3">{time}</Button>
                            </Link>
                        ))
                    ) : (
                        <p>No available times for this route.</p>
                    )}
                </div>
            </Card>
        </>
    )
}

'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import TimeSlot from '@/app/ui/timeslot/timeslotadmin'
import DisplayDate from '@/app/ui/display-date/display-date'

export default function Page() {
    const router = useRouter()

    const handleBack = () => {
        router.back()
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Button variant="outline" onClick={handleBack} className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            <div className="flex flex-col gap-5">
                <DisplayDate />

                <TimeSlot from="Siam Paragon" to="Assumption University" />
                <TimeSlot from="Assumption University" to="Siam Paragon" />
                <TimeSlot from="Assumption University" to="Mega Bangna" />
                <TimeSlot from="Mega Bangna" to="Assumption University" />
            </div>
        </div>
    )
}

import TimeSlot from '@/app/ui/timeslot/timeslot'
import DisplayDate from '@/app/ui/display-date/display-date'

export default function Page() {
    return (
        <div className="flex flex-col gap-5">
            <DisplayDate />
            <TimeSlot from="Siam Paragon" to="Assumption University" />
            <TimeSlot from="Assumption University" to="Siam Paragon" />
            <TimeSlot from="Assumption University" to="Mega Bangna" />
            <TimeSlot from="Mega Bangna" to="Assumption University" />
        </div>
    )
}

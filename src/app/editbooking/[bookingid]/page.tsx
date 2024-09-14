import BookForm from '@/app/ui/timeslot/bookForm'

export default function Page({ params }: {params: any}) {
    const date = new Date()
    return <BookForm date={date} isEdit={{edit: true, id: params.bookingid}} />
}

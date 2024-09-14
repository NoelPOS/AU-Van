import BookForm from '@/app/ui/timeslot/bookForm'
import NavBar from '@/app/ui/navbar/navbar'

export default function Page({ params }: { params: any }) {
    const date = new Date()
    return (
        <>
            <div className="flex justify-between items-center mb-10">
                <NavBar />
            </div>
            <div className="flex flex-col items-center justify-center w-full">
                <BookForm
                    date={date}
                    isEdit={{ edit: true, id: params.bookingid }}
                />
            </div>
        </>
    )
}

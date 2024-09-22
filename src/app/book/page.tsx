'use client'
import NavBar from '@/app/ui/navbar/navbar'
import BookFormPage from '@/app/ui/timeslot/bookForm'

export default function Page() {
    const date = new Date()

    return (
        <main className="">
            <div className="flex justify-between items-center mb-10">
                <NavBar />
            </div>

            <div className="flex justify-center items-center">
                <BookFormPage date={date} isEdit={{ edit: false, id: 0 }} />
            </div>
        </main>
    )
}

import NavBar from '@/app/ui/navbar/navbar'
import BookForm from '@/app/ui/timeslot/bookForm'

export default function Page() {
  const date = new Date()

  return (
    <main className=''>
      <div className='flex justify-between items-center mb-10'>
        <NavBar />
      </div>

      <div className='flex justify-center items-center'>
        <BookForm date={date} />
      </div>
    </main>
  )
}

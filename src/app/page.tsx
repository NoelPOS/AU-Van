'use client'

import NavBar from '@/app/ui/navbar/navbar'
import DestinationSelection from '@/app/ui/destination-selection/destination-selection'
import Logo from '@/app/assets/img/Logo.png'

import Image from 'next/image'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function Home() {
  const { status } = useSession()
  if (status === 'authenticated') {
    return (
      <main className='flex flex-col gap-10'>
        <div className='flex justify-between items-center'>
          <NavBar />
        </div>

        <div className='flex flex-col justify-center items-center h-full gap-5'>
          <DestinationSelection />
        </div>
      </main>
    )
  } else if (status === 'loading') {
    return <span className='text-[#888] text-sm mt-7'>Loading...</span>
  } else {
    return (
      <div className='flex flex-col justify-center items-center h-screen '>
        <h1>Welcome aboard!</h1>
        <div className='hidden bg-muted lg:block'>
          <Image
            src={Logo}
            alt='Image'
            className=' object-cover dark:brightness-[0.2] dark:grayscale rounded-lg'
          />
        </div>
        <Link
          href='/auth'
          className='text-[#888] text-sm text-999 mt-7 transition duration-150 ease hover:text-white'
        >
          Login here
        </Link>
      </div>
    )
  }
}

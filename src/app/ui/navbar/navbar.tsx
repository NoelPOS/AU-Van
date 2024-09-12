'use client'

import { use, useState, useEffect } from 'react'
import logo from '@/app/navbar/logo.png'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

import { signOut } from 'next-auth/react'

export default function NavBar() {
    return (
        <>
            <div>
                <Link href="/">
                    <Image
                        src={`/navbar/logo.png`}
                        alt={'AU Van logo'}
                        width="120"
                        height="120"
                    />
                </Link>
            </div>

      <div className='flex gap-10 underline underline-offset-8 items-center'>
        <Link href='/'>Home</Link>
        <Link href='/mybookings'>My Bookings</Link>
        <Link href='/profile/'>Profile</Link>
        <Link href='/'>
          <Button
            onClick={() => {
              signOut()
            }}
          >
            Logout
          </Button>
        </Link>
      </div>
    </>
  )
}

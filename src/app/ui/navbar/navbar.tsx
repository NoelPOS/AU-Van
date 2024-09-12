'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import React from 'react'

export default function NavBar() {
    const { data: session } = useSession()
    const [userData, setUserData] = React.useState(session?.user)

    console.log(userData.anem)

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

            <div className="flex gap-10 underline underline-offset-8 items-center">
                <Link href="/">Home</Link>
                <Link href="/mybookings">My Bookings</Link>
                <Link href="/profile/">Profile</Link>
            </div>
            <div className='flex gap-3 items-center'>
                <p className="no-underline">Name: {userData.name}</p>
                <Link href="/">
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

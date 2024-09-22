'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, X } from 'lucide-react'

export default function NavBar() {
    const { data: session } = useSession()
    const [userData, setUserData] = useState(session?.user)
    const [admin, setAdmin] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        setUserData(session?.user)
        setAdmin(session?.user?.email === 'testing@gmail.com')
    }, [session])

    const NavItems = () => (
        <>
            {admin && <NavLink href="/admin">Admin</NavLink>}
            <NavLink href="/">Home</NavLink>
            <NavLink href="/mybookings">My Bookings</NavLink>
            <NavLink href="/profile">Profile</NavLink>
        </>
    )

    const NavLink = ({
        href,
        children,
    }: {
        href: string
        children: React.ReactNode
    }) => (
        <Link
            href={href}
            className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            onClick={() => setIsOpen(false)}
        >
            {children}
        </Link>
    )

    return (
        <nav className="bg-white shadow-md w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex-shrink-0">
                            <Image
                                src="/navbar/logo.png"
                                alt="AU Van logo"
                                width={120}
                                height={60}
                                className="h-15 w-auto"
                            />
                        </Link>
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        <NavItems />
                    </div>
                    <div className="hidden md:flex items-center space-x-4">
                        {userData && (
                            <span className="text-sm text-gray-600">
                                Hello, {userData.name}
                            </span>
                        )}
                        <Button
                            onClick={() => signOut()}
                            variant="outline"
                            size="sm"
                        >
                            Logout
                        </Button>
                    </div>
                    <div className="md:hidden flex items-center">
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-6 w-6" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="right"
                                className="w-[300px] sm:w-[400px]"
                            >
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center justify-between py-4">
                                        <Image
                                            src="/navbar/logo.png"
                                            alt="AU Van logo"
                                            width={100}
                                            height={33}
                                            className="h-8 w-auto"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <X className="h-6 w-6" />
                                            <span className="sr-only">
                                                Close menu
                                            </span>
                                        </Button>
                                    </div>
                                    <div className="flex flex-col space-y-4 mt-4">
                                        <NavItems />
                                    </div>
                                    <div className="mt-auto pb-4">
                                        {userData && (
                                            <span className="text-sm text-gray-600 block mb-2">
                                                Hello, {userData.name}
                                            </span>
                                        )}
                                        <Button
                                            onClick={() => {
                                                setIsOpen(false)
                                                signOut()
                                            }}
                                            className="w-full"
                                        >
                                            Logout
                                        </Button>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </nav>
    )
}

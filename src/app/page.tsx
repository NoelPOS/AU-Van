'use client'

import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronRight } from 'lucide-react'
import Logo from '@/app/assets/img/Logo.png'
import Car from '@/app/assets/img/Car.png'


export default function Home() {
  const { status } = useSession()

  if (status === 'loading') {
    return <LoadingState />
  }

  if (status === 'unauthenticated') {
    return <UnauthenticatedState />
  }

  return <AuthenticatedState />
}

function LoadingState() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="h-4 w-[200px] mt-4" />
    </div>
  )
}

function UnauthenticatedState() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Welcome aboard!
          </CardTitle>
          <CardContent className="text-sm font-bold text-center">
            For Admin - use testing@gmail.com and 123456!
          </CardContent>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="w-32 h-32 relative mb-6">
            <Image
              src={Logo}
              alt="AU Vans Logo"
              layout="fill"
              objectFit="contain"
              className="dark:brightness-90 dark:contrast-125"
            />
          </div>
          <Button asChild variant="outline">
            <Link href="/auth">
              Login here
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}


function AuthenticatedState() {
  return (
    <div className="min-h-calc[100vh-4rem] ">
      <main>
        <div className="mx-auto py-12 sm:px-6 lg:px-8 ">
          
            <div className="flex flex-col lg:flex-row items-center justify-center">
              <div className="p-6 md:p-12 flex flex-col justify-center">
                <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                  AU Vans
                </h1>
                <p className="mt-4 text-lg text-gray-500">
                  The AU Van service provides convenient transportation for
                  Assumption University students and staff, connecting the
                  campus with key destinations like Siam and Mega Bangna. With
                  regular schedules, the AU Van ensures a comfortable and
                  reliable commute to popular areas for shopping, dining, and
                  leisure.
                </p>
                <div className="mt-8 z-10">
                    <Link href="/routes">
                        <Button className='bg-black text-white'>
                            Book Now
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>

                </div>
              </div>
              <div className="bg-green-300">
                <Image
                  src={Car}
                  alt="AU Van"
                  objectFit="contain"
                    width={3200}
                    height={400}
                  className="rounded-sm"
                  priority
                />
              </div>
            </div>
          </div>
        
      </main>
    </div>
  )
}

import React, { Dispatch, SetStateAction } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import Car from '../assets/img/Car.png'
import Logo from '../assets/img/Logo.png'

interface Props {
  showLogin: boolean
  setShowLogin: Dispatch<SetStateAction<boolean>>
}

const Signup = (props: Props) => {
  return (
    <div className='w-full lg:grid lg:min-h-[500px] lg:grid-cols-2 xl:min-h-[580px] flex items-center justify-center '>
      <div className='hidden bg-muted lg:block'>
        <Image
          src={Car}
          alt='Image'
          className=' object-cover dark:brightness-[0.2] dark:grayscale rounded-lg'
        />
      </div>
      <div className='flex items-center justify-center py-12'>
        <div className='mx-auto grid w-[350px] gap-6'>
          <div className='grid gap-2 text-center'>
            <div className='flex flex-col items-center justify-center'>
              <Image
                src={Logo}
                alt='Image'
                className=' object-cover dark:brightness-[0.2] dark:grayscale rounded-lg'
              />
              <h2 className='text-3xl font-bold'>AU Van Service </h2>
            </div>
          </div>
          <div className='grid gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='email'>Name</Label>
              <Input id='email' type='email' placeholder='John Doe' required />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='m@example.com'
                required
              />
            </div>
            <div className='grid gap-2'>
              <div className='flex items-center'>
                <Label htmlFor='password'>Password</Label>
                {/* <Link
                  href='/forgot-password'
                  className='ml-auto inline-block text-sm underline'
                >
                  Forgot your password?
                </Link> */}
              </div>
              <Input id='password' type='password' required />
            </div>
            <Button type='submit' className='w-full'>
              Sign Up
            </Button>
            {/* <Button variant='outline' className='w-full'>
              Login with Google
            </Button> */}
          </div>
          <div className='mt-4 text-center text-sm'>
            Already have an account?{' '}
            <Link
              href='#'
              className='underline'
              onClick={() => {
                props.setShowLogin(true)
              }}
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup

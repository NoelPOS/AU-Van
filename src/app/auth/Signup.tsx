'use client'

import { FormEvent, useEffect, useState } from 'react'
import axios, { AxiosError } from 'axios'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BiLogoGoogle } from 'react-icons/bi'
import { BiSolidShow } from 'react-icons/bi'
import { BiSolidHide } from 'react-icons/bi'

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
  const [error, setError] = useState()
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  const labelStyles = 'w-full text-sm'

  useEffect(() => {
    if (session) {
      router.push('/')
    }
  }, [session, router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const formData = new FormData(event.currentTarget)
      const signupResponse = await axios.post('/api/auth/signup', {
        email: formData.get('email'),
        password: formData.get('password'),
        name: formData.get('name'),
        // phone: formData.get('phone'),
      })

      const res = await signIn('credentials', {
        email: signupResponse.data.email,
        password: formData.get('password'),
        redirect: false,
      })

      if (res?.ok) return router.push('/')
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data.message
        setError(errorMessage)
      }
    }
  }

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
          <form onSubmit={handleSubmit}>
            <div className='grid gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='name'>Name</Label>
                <Input
                  id='name'
                  type='text'
                  placeholder='John Doe'
                  name='name'
                  required
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='m@example.com'
                  name='email'
                  required
                />
              </div>
              <div className='grid gap-2'>
                <div className='flex items-center'>
                  <Label htmlFor='password'>Password</Label>
                </div>
                <div className='flex items-center'>
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    required
                    name='password'
                  />
                  <button
                    className='border border-solid border-[#afacac] rounded flex items-center justify-center transition duration-150 ease h-full w-1/12'
                    onClick={(e) => {
                      e.preventDefault()
                      setShowPassword(!showPassword)
                    }}
                  >
                    {showPassword ? <BiSolidHide /> : <BiSolidShow />}
                  </button>
                </div>
              </div>
              <Button type='submit' className='w-full'>
                Sign Up
              </Button>
            </div>
            <div className='w-full h-10	relative flex items-center justify-center'>
              <div className='absolute h-px w-full top-2/4 bg-[#242424]'></div>
              <p className='w-8	h-6 bg-white z-10 flex items-center justify-center'>
                or
              </p>
            </div>

            <button
              className='flex mx-auto py-2 px-4 text-sm	 items-center rounded text-999 bg-white
              border border-solid border-[#242424] transition duration-150 ease gap-3'
              onClick={(e) => {
                e.preventDefault()
                signIn('google')
              }}
            >
              <BiLogoGoogle className='text-2xl' /> Sign in with Google
            </button>

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
          </form>
        </div>
      </div>
    </div>
  )
}

export default Signup

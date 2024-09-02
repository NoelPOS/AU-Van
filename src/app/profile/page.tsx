'use client'
import React, { FormEvent, use, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import axios from 'axios'

const handleSubmit = async (
  event: FormEvent<HTMLFormElement>,
  userid: string
) => {
  event.preventDefault()
  const form = event.currentTarget
  const data = new FormData(form)
  const name = data.get('Name')
  const email = data.get('email')
  const oldPwd = data.get('old-pwd')
  const newPwd = data.get('new-pwd')
  try {
    const response = await axios.put('/api/auth/updateuserdata', {
      userid,
      name,
      email,
      oldPwd,
      newPwd,
    })
    alert(response.data.message)
    console.log(response.data)
  } catch (error) {
    console.error(error)
  }
}

const Profile = () => {
  const data = useSession().data?.user
  const [userData, setUserData] = React.useState(data)
  const [userid, setUserId] = React.useState(userData?._id)
  const [password, setPassword] = React.useState('')

  return (
    <div className='flex items-center justify-center w-full h-screen'>
      <form className='divide-y divide-gray-100 text-sm w-full max-w-md'>
        <div className='flex flex-col py-3'>
          <label className='font-medium text-gray-900' htmlFor='Name'>
            Name
          </label>
          <input
            className='text-gray-700 border rounded p-1'
            type='text'
            id='Name'
            name='Name'
            defaultValue={userData?.name}
          />
        </div>

        <div className='flex flex-col py-3'>
          <label className='font-medium text-gray-900' htmlFor='email'>
            Email
          </label>
          <input
            className='text-gray-700 border rounded p-1'
            type='text'
            id='email'
            name='email'
            defaultValue={userData?.email}
          />
        </div>

        <div className='flex flex-col py-3'>
          <label className='font-medium text-gray-900' htmlFor='old-pwd'>
            Old Password
          </label>
          <input
            className='text-gray-700 border rounded p-1'
            type='text'
            id='old-pwd'
            name='old-pwd'
          />
        </div>
        <div className='flex flex-col py-3'>
          <label className='font-medium text-gray-900' htmlFor='new-pwd'>
            New Password
          </label>
          <input
            className='text-gray-700 border rounded p-1'
            type='text'
            id='new-pwd'
            name='new-pwd'
          />
        </div>
        <div>
          <Button type='submit'>Save</Button>
        </div>
      </form>
    </div>
  )
}

export default Profile

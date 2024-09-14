'use client'

import React, { FormEvent, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import NavBar from '../ui/navbar/navbar'

const Profile = () => {
    const router = useRouter()
    const { data: session } = useSession()
    const [userData, setUserData] = React.useState(session?.user)
    const [error, setError] = React.useState('')

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const form = event.currentTarget
        const data = new FormData(form)
        const userid = data.get('userid')
        const name = data.get('Name')
        const email = data.get('email')
        const oldPwd = data.get('oldpwd')
        const newPwd = data.get('newpwd')

        try {
            const response = await axios.put('/api/auth/userdata', {
                userid,
                name,
                email,
                oldPwd,
                newPwd,
            })
            router.back()
            alert('Success')
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        if (session?.user?._id && !userData) {
            // Only fetch if userData isn't already set
            const fetchUserData = async () => {
                try {
                    const response = await axios.post('/api/auth/userdata/', {
                        id: session.user._id,
                    })
                    setUserData(response.data)
                } catch (error) {
                    console.error(error)
                }
            }
            fetchUserData()
        }
    }, [session, userData])

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError('')
    }

    return (
        <>
            <div className="flex justify-between items-center mb-10">
                <NavBar />
            </div>
            <div className="flex flex-col items-center justify-center w-full">
                {error && <p className="text-red-500">{error}</p>}
                <form
                    className="divide-y divide-gray-100 text-sm w-full max-w-md"
                    onSubmit={handleSubmit}
                >
                    <div className="flex flex-col py-3">
                        <label
                            className="font-medium text-gray-900"
                            htmlFor="userid"
                        >
                            User Id
                        </label>
                        <input
                            readOnly
                            className="text-gray-700 border rounded p-1"
                            type="text"
                            id="userid"
                            name="userid"
                            defaultValue={userData?._id}
                        />
                    </div>
                    <div className="flex flex-col py-3">
                        <label
                            className="font-medium text-gray-900"
                            htmlFor="Name"
                        >
                            Name
                        </label>
                        <input
                            className="text-gray-700 border rounded p-1"
                            type="text"
                            id="Name"
                            name="Name"
                            defaultValue={userData?.name}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="flex flex-col py-3">
                        <label
                            className="font-medium text-gray-900"
                            htmlFor="email"
                        >
                            Email
                        </label>
                        <input
                            className="text-gray-700 border rounded p-1"
                            type="text"
                            id="email"
                            name="email"
                            defaultValue={userData?.email}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="flex flex-col py-3">
                        <label
                            className="font-medium text-gray-900"
                            htmlFor="oldpwd"
                        >
                            Old Password
                        </label>
                        <input
                            className="text-gray-700 border rounded p-1"
                            type="text"
                            id="oldpwd"
                            name="oldpwd"
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="flex flex-col py-3">
                        <label
                            className="font-medium text-gray-900"
                            htmlFor="newpwd"
                        >
                            New Password
                        </label>
                        <input
                            className="text-gray-700 border rounded p-1"
                            type="text"
                            id="newpwd"
                            name="newpwd"
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </div>
        </>
    )
}

export default Profile

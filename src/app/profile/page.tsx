'use client'

import React, { FormEvent, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Save, Trash2, User, Mail, Lock } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

function Profile() {
  const { data: session, status } = useSession()
  const [userData, setUserData] = useState(session?.user)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Wait for the session to load

    if (status === 'unauthenticated') {
      router.push('/auth') // Redirect to signin page if not authenticated
      return
    }

    // Only fetch user data if authenticated and data not already loaded
    if (status === 'authenticated' && session?.user?._id && !userData) {
      const fetchUserData = async () => {
        try {
          const response = await axios.post('/api/auth/userdata/', {
            id: session.user._id,
          })
          setUserData(response.data)
        } catch (error) {
          console.error(error)
          setError('Failed to fetch user data')
        }
      }
      fetchUserData()
    }
  }, [status, session, userData, router])

  // If still loading, you might want to show a loading state
  if (status === 'loading') {
    return <div>Loading...</div>
  }

  // If not authenticated, don't render anything (will redirect)
  if (status === 'unauthenticated') {
    return null
  }

  const handleDelete = async () => {
    try {
      await axios.delete('/api/auth/userdata', {
        data: JSON.stringify({ userid: session?.user?._id }),
      })
      setSuccess('Account successfully deleted')
      setTimeout(() => {
        signOut()
        router.push('/')
      }, 2000)
    } catch (error: any) {
      console.error(error.response?.data?.error || 'An error occurred')
      setError(error.response?.data?.error || 'Failed to delete account')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const form = event.currentTarget
    const data = new FormData(form)
    const name = data.get('Name')
    const email = data.get('email')
    const oldPwd = data.get('oldpwd')
    const newPwd = data.get('newpwd')

    try {
      const response = await axios.put('/api/auth/userdata', {
        userid: session?.user?._id,
        name,
        email,
        oldPwd,
        newPwd,
      })
      setSuccess('Profile updated successfully')
      setUserData(response.data)
      setIsEditing(false)
    } catch (error: any) {
      console.error(error.response?.data?.error || 'An error occurred')
      setError(error.response?.data?.error || 'Failed to update profile')
    }
  }

  return (
    <div className="min-h-calc[100vh-4rem] ">
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Profile</CardTitle>
            <CardDescription>
              Manage your account settings and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert
                variant="default"
                className="mb-4 bg-green-100 text-green-800 border-green-300"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="Name">Name</Label>
                <div className="relative">
                  <User className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="Name"
                    name="Name"
                    defaultValue={userData?.name || ''}
                    className="pl-8"
                    readOnly={!isEditing}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={userData?.email || ''}
                    className="pl-8"
                    readOnly={!isEditing}
                  />
                </div>
              </div>
              {isEditing && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="oldpwd">Current Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        id="oldpwd"
                        name="oldpwd"
                        type="password"
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newpwd">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        id="newpwd"
                        name="newpwd"
                        type="password"
                        className="pl-8"
                      />
                    </div>
                  </div>
                </>
              )}
              <CardFooter className="flex justify-between px-0" >
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" type="button">
                      <Trash2 className="mr-2 h-4 w-4 " />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove your data from our
                        servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {isEditing ? (
                  <div className='flex items-center'>
                    <button className='bg-black text-white px-4 py-2 rounded-md mr-2' type="button" onClick={() => setIsEditing(false)}>
                      Cancel
                    </button>
                    <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                  </div>
                  
                ) : (
                  <button className='bg-black text-white px-4 py-2 rounded-md' type="button" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </button>
                )}
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default Profile

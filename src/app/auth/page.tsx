'use client'
import { useState } from 'react'

import Login from './Login'
import Signup from './Signup'

export default function Auth() {
  const [showLogin, setShowLogin] = useState(true)
  return showLogin ? (
    <Login showLogin={showLogin} setShowLogin={setShowLogin} />
  ) : (
    <Signup showLogin={showLogin} setShowLogin={setShowLogin} />
  )
}

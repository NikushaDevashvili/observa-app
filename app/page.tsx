'use client'

import { useState } from 'react'
import SignupForm from './components/SignupForm'
import SuccessPage from './components/SuccessPage'

export default function Home() {
  const [signupData, setSignupData] = useState<{
    apiKey: string
    tenantId: string
    projectId: string
    environment: string
    message: string
  } | null>(null)

  const handleSignupSuccess = (data: {
    apiKey: string
    tenantId: string
    projectId: string
    environment: string
    message: string
  }) => {
    setSignupData(data)
  }

  const handleBackToSignup = () => {
    setSignupData(null)
  }

  if (signupData) {
    return <SuccessPage data={signupData} onBack={handleBackToSignup} />
  }

  return <SignupForm onSuccess={handleSignupSuccess} />
}


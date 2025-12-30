'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [user, setUser] = useState<{ email: string } | null>(null)

  useEffect(() => {
    // Get session token from localStorage
    const token = localStorage.getItem('sessionToken')
    if (!token) {
      router.push('/auth/login')
      return
    }
    setSessionToken(token)

    // Fetch user info
    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        } else {
          localStorage.removeItem('sessionToken')
          router.push('/auth/login')
        }
      })
      .catch(() => {
        localStorage.removeItem('sessionToken')
        router.push('/auth/login')
      })
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('sessionToken')
    router.push('/auth/login')
  }

  if (!sessionToken || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Navigation */}
      <nav style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e5e5e5',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link href="/dashboard" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb', textDecoration: 'none' }}>
            Observa
          </Link>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/dashboard" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: 500 }}>
              Dashboard
            </Link>
            <Link href="/dashboard/conversations" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: 500 }}>
              Conversations
            </Link>
            <Link href="/dashboard/traces" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: 500 }}>
              Traces
            </Link>
            <Link href="/dashboard/settings" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: 500 }}>
              Settings
            </Link>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#6b7280' }}>{user.email}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}


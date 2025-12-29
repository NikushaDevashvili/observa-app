import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route for onboarding signup (legacy endpoint)
 * Hides the actual API URL from the client
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Call your real API server-side (URL is private)
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${apiUrl}/api/v1/onboarding/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Signup failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Proxy] Onboarding signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


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
    
    // Use auth/signup endpoint (onboarding/signup doesn't exist on backend)
    const response = await fetch(`${apiUrl}/api/v1/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Check content-type before parsing
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    if (!response.ok) {
      // Handle non-JSON error responses
      if (isJson) {
        const data = await response.json();
        return NextResponse.json(
          { error: data.error || 'Signup failed' },
          { status: response.status }
        );
      } else {
        // Response is HTML or other non-JSON format
        const text = await response.text();
        console.error('[API Proxy] Non-JSON error response:', text.substring(0, 200));
        return NextResponse.json(
          { error: `Signup failed: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }
    }

    // Parse successful response
    if (isJson) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const text = await response.text();
      console.error('[API Proxy] Non-JSON success response:', text.substring(0, 200));
      return NextResponse.json(
        { error: 'Invalid response format from API' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('[API Proxy] Onboarding signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


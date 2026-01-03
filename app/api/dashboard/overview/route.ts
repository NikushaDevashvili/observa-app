import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Proxy route for dashboard overview
 * GET /api/dashboard/overview
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const queryString = searchParams.toString();
    const url = `${apiUrl}/api/v1/dashboard/overview${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[API Proxy] Dashboard overview error:', {
        status: response.status,
        error: data.error,
        url,
        queryString,
      });
      return NextResponse.json(
        { error: data.error || 'Failed to fetch dashboard overview' },
        { status: response.status }
      );
    }

    // Log successful response for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[API Proxy] Dashboard overview success:', {
        traceCount: data.metrics?.trace_count,
        timeRange: queryString,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Proxy] Dashboard overview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


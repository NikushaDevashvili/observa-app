import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy route for a specific trace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { traceId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    const traceId = params.traceId;
    
    // Forward query parameters (e.g., format=tree)
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${apiUrl}/api/v1/traces/${traceId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch trace' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Proxy] Trace detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Proxy route for completing onboarding task
 * POST /api/onboarding/tasks/:taskKey/complete
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { taskKey: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { taskKey } = params;
    const body = await request.json().catch(() => ({}));

    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://observa-api.vercel.app';
    const url = `${apiUrl}/api/v1/onboarding/tasks/${taskKey}/complete`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to complete task' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Proxy] Complete task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



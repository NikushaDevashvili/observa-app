import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Proxy route for skipping onboarding task
 * POST /api/onboarding/tasks/:taskKey/skip
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

    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://observa-api.vercel.app';
    const url = `${apiUrl}/api/v1/onboarding/tasks/${taskKey}/skip`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to skip task' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Proxy] Skip task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



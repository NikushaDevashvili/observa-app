import { NextRequest, NextResponse } from "next/server";

// Detect production environment and use correct API URL
const getApiUrl = () => {
  if (process.env.API_URL) {
    return process.env.API_URL;
  }
  // In production (Vercel), default to production API
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return "https://observa-api.vercel.app";
  }
  // Local development
  return "http://localhost:3000";
};

const API_URL = getApiUrl();

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 }
      );
    }

    const { conversationId } = params;
    const url = `${API_URL}/api/v1/conversations/${conversationId}`;

    console.log(`[Conversation Detail API] Fetching from: ${url}`);

    const response = await fetch(url, {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error(`[Conversation Detail API] Backend error (${response.status}):`, errorData);
      return NextResponse.json(
        { 
          error: errorData.error || "Failed to fetch conversation",
          details: errorData.details || `HTTP ${response.status}`,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[Conversation Detail API] Error proxying request:", error);
    console.error("[Conversation Detail API] API_URL:", API_URL);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        apiUrl: API_URL
      },
      { status: 500 }
    );
  }
}


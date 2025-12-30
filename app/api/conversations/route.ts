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

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const url = new URL(`${API_URL}/api/v1/conversations`);
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    console.log(`[Conversations API] Fetching from: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error(`[Conversations API] Backend error (${response.status}):`, errorData);
      return NextResponse.json(
        { 
          error: errorData.error || "Failed to fetch conversations",
          details: errorData.details || `HTTP ${response.status}`,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[Conversations API] Response received:`, {
      success: data.success,
      conversationsCount: data.conversations?.length || 0,
      pagination: data.pagination,
      hasData: !!data.conversations
    });
    
    // Ensure we always return the expected format
    if (!data.success) {
      console.warn(`[Conversations API] Response missing success flag:`, data);
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[Conversations API] Error proxying request:", error);
    console.error("[Conversations API] API_URL:", API_URL);
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


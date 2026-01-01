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
    const url = new URL(`${API_URL}/api/v1/sessions`);
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    console.log(`[Sessions API] Fetching from: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error(`[Sessions API] Backend error (${response.status}):`, errorData);
      return NextResponse.json(
        { 
          error: errorData.error || "Failed to fetch sessions",
          details: errorData.details || `HTTP ${response.status}`,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[Sessions API] Response received:`, {
      success: data.success,
      sessionsCount: data.sessions?.length || 0,
      pagination: data.pagination,
      hasData: !!data.sessions
    });
    
    // Ensure we always return the expected format
    if (!data.success) {
      console.warn(`[Sessions API] Response missing success flag:`, data);
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[Sessions API] Error proxying request:", error);
    console.error("[Sessions API] API_URL:", API_URL);
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


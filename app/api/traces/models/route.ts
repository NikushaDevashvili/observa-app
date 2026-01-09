import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy route for listing available models
 * Mirrors observa-api: GET /api/v1/traces/models
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const apiUrl = process.env.API_URL || "http://localhost:3000";
    const queryString = searchParams.toString();
    const url = `${apiUrl}/api/v1/traces/models${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { error: (data as any)?.error || "Failed to fetch models" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Traces models error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}






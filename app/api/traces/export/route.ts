import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy route for traces export
 * Mirrors observa-api: GET /api/v1/traces/export
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
    const url = `${apiUrl}/api/v1/traces/export${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    // Pass-through body as text to support CSV downloads
    const body = await response.text();

    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    const contentDisposition = response.headers.get("content-disposition");
    if (contentType) headers.set("content-type", contentType);
    if (contentDisposition) headers.set("content-disposition", contentDisposition);

    return new NextResponse(body, { status: response.status, headers });
  } catch (error) {
    console.error("[API Proxy] Traces export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}






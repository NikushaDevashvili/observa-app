import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy route for exporting a specific trace
 * Mirrors observa-api: GET /api/v1/traces/:traceId/export
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { traceId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiUrl = process.env.API_URL || "http://localhost:3000";
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${apiUrl}/api/v1/traces/${params.traceId}/export${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    const contentType = response.headers.get("content-type") || "application/json";

    if (contentType.includes("text/csv")) {
      const body = await response.text();
      const headers = new Headers();
      headers.set("content-type", contentType);
      const contentDisposition = response.headers.get("content-disposition");
      if (contentDisposition) headers.set("content-disposition", contentDisposition);
      return new NextResponse(body, { status: response.status, headers });
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json(
        { error: (data as any)?.error || "Failed to export trace" },
        { status: response.status }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Proxy] Trace export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



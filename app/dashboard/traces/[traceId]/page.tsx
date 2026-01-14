"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TraceViewer } from "@/components/agent-prism/TraceViewer/TraceViewer";
import type { TraceViewerData } from "@/components/agent-prism/TraceViewer/TraceViewer";
import { TraceViewerErrorBoundary } from "@/components/TraceViewerErrorBoundary";

export default function TraceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const traceId = params?.traceId as string | undefined;
  const [traceData, setTraceData] = useState<TraceViewerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!traceId) {
      setError("Trace ID is required");
      setLoading(false);
      return;
    }

    const fetchTrace = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("sessionToken");
        if (!token) {
          router.push("/auth/login");
          return;
        }

        // Fetch agent-prism formatted data
        const response = await fetch(
          `/api/traces/${traceId}?format=agent-prism`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("Trace not found");
          } else {
            const errorData = await response.json().catch(() => ({}));
            setError(
              errorData.error || `Failed to fetch trace: ${response.statusText}`
            );
          }
          return;
        }

        const data = await response.json();

        if (!data.success || !data.trace) {
          console.error("Invalid trace data:", data);
          setError("Invalid trace data");
          return;
        }

        // Validate the trace data structure
        const trace = data.trace;
        if (!trace.traceRecord || !trace.spans) {
          console.error("Missing required fields in trace data:", trace);
          setError("Invalid trace data structure");
          return;
        }

        // Validate traceRecord has required fields
        if (
          !trace.traceRecord.id ||
          typeof trace.traceRecord.spansCount !== "number"
        ) {
          console.error("Invalid traceRecord:", trace.traceRecord);
          setError("Invalid trace record structure");
          return;
        }

        // Ensure agentDescription is a string (required by TraceRecord)
        if (typeof trace.traceRecord.agentDescription !== "string") {
          trace.traceRecord.agentDescription =
            trace.traceRecord.agentDescription || "";
        }

        // Ensure spans is an array
        if (!Array.isArray(trace.spans)) {
          console.error("Spans is not an array:", trace.spans);
          setError("Invalid spans data");
          return;
        }

        // Log the data structure for debugging
        console.log("Trace data loaded:", {
          traceRecord: trace.traceRecord,
          spansCount: trace.spans?.length || 0,
          badgesCount: trace.badges?.length || 0,
          errorSummary: trace.errorSummary,
        });

        // The trace data is already in agent-prism format from the backend
        setTraceData(trace);
      } catch (err) {
        console.error("Failed to fetch trace:", err);
        setError(err instanceof Error ? err.message : "Failed to load trace");
      } finally {
        setLoading(false);
      }
    };

    if (traceId) {
      fetchTrace();
    }
  }, [traceId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading trace...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 px-4">
        <h2 className="text-xl sm:text-2xl font-bold text-center">Error</h2>
        <p className="text-muted-foreground text-center text-sm sm:text-base max-w-md">
          {error}
        </p>
        <Link href="/dashboard/traces">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Traces
          </Button>
        </Link>
      </div>
    );
  }

  if (!traceData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 px-4">
        <h2 className="text-xl sm:text-2xl font-bold text-center">
          Trace Not Found
        </h2>
        <p className="text-muted-foreground text-center text-sm sm:text-base max-w-md">
          The trace you're looking for doesn't exist or you don't have access to
          it.
        </p>
        <Link href="/dashboard/traces">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Traces
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -my-4 h-[calc(100vh-3rem)] sm:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b px-3 sm:px-4 py-3 sm:py-4 bg-background sticky top-0 z-10 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/dashboard/traces" className="self-start sm:self-auto">
              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto justify-start sm:justify-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
                <span className="sm:inline">Back to Traces</span>
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold truncate">
                Trace Details
              </h1>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0">Trace ID:</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono truncate max-w-full sm:max-w-none">
                    {traceId || "N/A"}
                  </code>
                </div>
                {traceData?.errorSummary &&
                  traceData.errorSummary.hasErrors && (
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      <span className="text-destructive font-medium text-xs sm:text-sm">
                        {traceData.errorSummary.totalErrors} Error
                        {traceData.errorSummary.totalErrors !== 1 ? "s" : ""}
                      </span>
                      {Object.keys(traceData.errorSummary.errorTypes).length >
                        0 && (
                        <span className="text-muted-foreground text-xs sm:text-sm">
                          (
                          <span className="hidden sm:inline">
                            {Object.entries(traceData.errorSummary.errorTypes)
                              .slice(0, 2)
                              .map(([type, count]) => `${count} ${type}`)
                              .join(", ")}
                            {Object.keys(traceData.errorSummary.errorTypes)
                              .length > 2
                              ? "..."
                              : ""}
                          </span>
                          <span className="sm:hidden">
                            {
                              Object.keys(traceData.errorSummary.errorTypes)
                                .length
                            }{" "}
                            type
                            {Object.keys(traceData.errorSummary.errorTypes)
                              .length !== 1
                              ? "s"
                              : ""}
                          </span>
                          )
                        </span>
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TraceViewer */}
      <div className="flex-1 overflow-hidden px-3 sm:px-4 min-h-0 w-full max-w-full">
        <TraceViewerErrorBoundary>
          {traceData && traceData.traceRecord && traceData.spans ? (
            <div className="h-full w-full max-w-full overflow-hidden">
              <TraceViewer data={[traceData]} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-red-500 text-sm sm:text-base">
                Invalid trace data format
              </div>
            </div>
          )}
        </TraceViewerErrorBoundary>
      </div>
    </div>
  );
}

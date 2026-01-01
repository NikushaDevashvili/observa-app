"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TraceViewer } from "@/components/agent-prism/TraceViewer/TraceViewer";
import type { TraceViewerData } from "@/components/agent-prism/TraceViewer/TraceViewer";

export default function TraceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const traceId = params.traceId as string;
  const [traceData, setTraceData] = useState<TraceViewerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        const response = await fetch(`/api/traces/${traceId}?format=agent-prism`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("Trace not found");
          } else {
            const errorData = await response.json().catch(() => ({}));
            setError(errorData.error || `Failed to fetch trace: ${response.statusText}`);
          }
          return;
        }

        const data = await response.json();
        
        if (!data.success || !data.trace) {
          setError("Invalid trace data");
          return;
        }

        // The trace data is already in agent-prism format from the backend
        setTraceData(data.trace);
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading trace...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <h2 className="text-2xl font-bold">Error</h2>
        <p className="text-muted-foreground">{error}</p>
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
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <h2 className="text-2xl font-bold">Trace Not Found</h2>
        <p className="text-muted-foreground">
          The trace you're looking for doesn't exist or you don't have access to it.
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
    <div className="h-screen w-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/traces">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Traces
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Trace Details</h1>
              <div className="text-sm text-muted-foreground mt-1">
                Trace ID: <code className="bg-muted px-2 py-1 rounded text-xs">{traceId.substring(0, 12)}...</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TraceViewer */}
      <div className="flex-1 overflow-hidden">
        <TraceViewer data={[traceData]} />
      </div>
    </div>
  );
}

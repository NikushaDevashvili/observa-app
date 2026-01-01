"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, DollarSign, Zap, User, MessageSquare } from "lucide-react";
import TraceWaterfall from "@/components/traces/TraceWaterfall";
import NodeInspector from "@/components/traces/NodeInspector";
import StatisticsCard from "@/components/StatisticsCard";

interface Span {
  id?: string;
  span_id: string;
  parent_span_id: string | null;
  name: string;
  start_time: string;
  end_time: string;
  duration_ms: number;
  events: any[];
  children?: Span[];
  metadata?: {
    model?: string | null;
    environment?: string | null;
    conversation_id?: string | null;
    session_id?: string | null;
    user_id?: string | null;
  };
  // Additional fields from backend
  details?: any;
  llm_call?: any;
  tool_call?: any;
  retrieval?: any;
  output?: any;
  type?: string;
  hasDetails?: boolean;
  selectable?: boolean;
}

interface TraceTreeData {
  summary: {
    trace_id: string;
    tenant_id: string;
    project_id: string;
    environment: string;
    conversation_id?: string | null;
    session_id?: string | null;
    user_id?: string | null;
    start_time: string;
    end_time: string;
    total_latency_ms: number;
    total_tokens: number;
    total_cost: number | null;
    model?: string | null;
  };
  spans: Span[];
  // CRITICAL: Include allSpans and spansById for child span lookup
  allSpans?: Span[];
  spansById?: Record<string, Span>;
  signals: Array<{
    signal_type: string;
    severity: string;
    confidence?: number | null;
    score?: number | null;
    reasoning?: string | null;
  }>;
  analysis?: any;
}

export default function TraceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const traceId = params.traceId as string;
  const [traceData, setTraceData] = useState<TraceTreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrace = async () => {
      try {
        const token = localStorage.getItem("sessionToken");
        if (!token) {
          router.push("/auth/login");
          return;
        }

        // Fetch new tree format
        const response = await fetch(`/api/traces/${traceId}?format=tree`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.trace) {
            setTraceData(data.trace);
            // Select first span by default
            if (data.trace.spans && data.trace.spans.length > 0) {
              setSelectedSpanId(data.trace.spans[0].span_id);
            }
          }
        } else if (response.status === 404) {
          // Trace not found
        }
      } catch (error) {
        console.error("Failed to fetch trace:", error);
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
      <div className="flex items-center justify-center h-96">
        <div>Loading trace...</div>
      </div>
    );
  }

  if (!traceData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
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

  // CRITICAL FIX: Use allSpans or spansById to find child spans
  // The main spans array only contains root spans, not children
  const findSpan = (spanId: string | null): Span | null => {
    if (!spanId) return null;
    
    // First try spansById lookup (fastest - O(1))
    if (traceData.spansById && traceData.spansById[spanId]) {
      return traceData.spansById[spanId];
    }
    
    // Fallback to allSpans array
    if (traceData.allSpans) {
      const found = traceData.allSpans.find(
        (s) => s.span_id === spanId || s.id === spanId
      );
      if (found) return found;
    }
    
    // Last resort: search in root spans (includes children via recursion)
    const searchInSpans = (spans: Span[]): Span | null => {
      for (const span of spans) {
        if (span.span_id === spanId || span.id === spanId) {
          return span;
        }
        if (span.children) {
          const found = searchInSpans(span.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return searchInSpans(traceData.spans);
  };
  
  const selectedSpan = findSpan(selectedSpanId);

  return (
    <>
      <div className="mx-4">
        {/* Header */}
        <div className="flex flex-row justify-between items-center">
          <div className="py-4">
            <Link href="/dashboard/traces">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Traces
              </Button>
            </Link>
            <h1 className="text-xl">Trace Details</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              <div>
                <strong>Trace ID:</strong>{" "}
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  {traceData.summary.trace_id.substring(0, 12)}...
                </code>
              </div>
              {traceData.summary.start_time && (
                <div>
                  <strong>Started:</strong>{" "}
                  {new Date(traceData.summary.start_time).toLocaleString()}
                </div>
              )}
              {traceData.summary.environment && (
                <div>
                  <strong>Environment:</strong>{" "}
                  <Badge variant="outline" className="ml-1">
                    {traceData.summary.environment.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 mb-6">
          <StatisticsCard
            title="Total Latency"
            value={`${traceData.summary.total_latency_ms}ms`}
            tooltip="Total trace execution time"
            icon={<Clock className="h-5 w-5" />}
          />
          <StatisticsCard
            title="Total Tokens"
            value={traceData.summary.total_tokens.toLocaleString()}
            tooltip="Total tokens used across all LLM calls"
            icon={<Zap className="h-5 w-5" />}
          />
          {traceData.summary.total_cost !== null && (
            <StatisticsCard
              title="Total Cost"
              value={`$${traceData.summary.total_cost.toFixed(4)}`}
              tooltip="Estimated cost for this trace"
              icon={<DollarSign className="h-5 w-5" />}
            />
          )}
          {traceData.summary.model && (
            <StatisticsCard
              title="Model"
              value={traceData.summary.model}
              tooltip="Primary model used"
              icon={<MessageSquare className="h-5 w-5" />}
            />
          )}
        </div>

        {/* Entity Badges */}
        {(traceData.summary.session_id ||
          traceData.summary.user_id ||
          traceData.summary.conversation_id) && (
          <div className="mb-6 flex gap-2 flex-wrap">
            {traceData.summary.session_id && (
              <Badge variant="outline" className="gap-1">
                <MessageSquare className="h-3 w-3" />
                Session: {traceData.summary.session_id.substring(0, 8)}...
              </Badge>
            )}
            {traceData.summary.user_id && (
              <Badge variant="outline" className="gap-1">
                <User className="h-3 w-3" />
                User: {traceData.summary.user_id.substring(0, 8)}...
              </Badge>
            )}
            {traceData.summary.conversation_id && (
              <Badge variant="outline">
                Conversation: {traceData.summary.conversation_id.substring(0, 8)}...
              </Badge>
            )}
          </div>
        )}

        {/* Signals/Issues */}
        {traceData.signals && traceData.signals.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Issues Detected</h2>
            <div className="flex flex-wrap gap-2">
              {traceData.signals.map((signal, idx) => (
                <Badge
                  key={idx}
                  variant={
                    signal.severity === "high"
                      ? "destructive"
                      : signal.severity === "medium"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {signal.signal_type.replace("_", " ")}
                  {signal.confidence !== null &&
                    signal.confidence !== undefined &&
                    ` (${(signal.confidence * 100).toFixed(0)}%)`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Waterfall Timeline + Node Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <TraceWaterfall
            spans={traceData.spans}
            selectedSpanId={selectedSpanId}
            onSelectSpan={setSelectedSpanId}
          />
          <NodeInspector span={selectedSpan} />
        </div>
      </div>
    </>
  );
}

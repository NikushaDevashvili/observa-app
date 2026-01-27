"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface Trace {
  trace_id: string;
  message_index: number | null;
  query: string | null;
  response: string | null;
  model: string | null;
  timestamp: string | null;
  is_hallucination: boolean | null;
  has_context_drop: boolean;
  has_faithfulness_issue: boolean;
  hallucination_confidence: number | null;
  context_relevance_score: string | null;
  answer_faithfulness_score: number | null;
}

interface Session {
  id: string;
  session_id: string;
  conversation_id: string | null;
  user_id: string | null;
  started_at: string;
  ended_at: string | null;
  message_count: number;
}

interface Analytics {
  totalMessages: number;
  totalTokens: number;
  averageLatency: number;
  issueCount: number;
  hallucinationRate: number;
  contextDropRate: number;
  faithfulnessIssueRate: number;
  duration: number | null;
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string | undefined;
  const [session, setSession] = useState<Session | null>(null);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch(`/api/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.session) {
          setSession(data.session);
        } else {
          setError(data.error || "Failed to load session");
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        setError(errorData.error || `Failed to load session (${response.status})`);
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
      setError(error instanceof Error ? error.message : "Failed to load session");
    }
  }, [sessionId, router]);

  const fetchTraces = useCallback(async () => {
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) return;

      const response = await fetch(
        `/api/sessions/${sessionId}/traces?limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.traces) {
          setTraces(data.traces);
        }
      }
    } catch (error) {
      console.error("Failed to fetch traces:", error);
    }
  }, [sessionId]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) return;

      const response = await fetch(
        `/api/sessions/${sessionId}/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.analytics) {
          setAnalytics(data.analytics);
        }
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      // Execute all fetches in parallel to eliminate waterfall
      Promise.allSettled([
        fetchSession(),
        fetchTraces(),
        fetchAnalytics(),
      ]);
    } else {
      setError("Session ID is required");
      setLoading(false);
    }
  }, [sessionId, fetchSession, fetchTraces, fetchAnalytics]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
          <Skeleton className="h-[92px]" />
          <Skeleton className="h-[92px]" />
          <Skeleton className="h-[92px]" />
          <Skeleton className="h-[92px]" />
        </div>
        <div className="space-y-2 pt-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div
        style={{
          padding: "2rem",
          backgroundColor: "#fff",
          borderRadius: "0.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ color: "#ef4444", marginBottom: "1rem" }}>
          {error ? "Error" : "Session not found"}
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
          {error || "The session you're looking for doesn't exist."}
        </p>
        <Link
          href="/dashboard/sessions"
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontSize: "0.875rem",
          }}
        >
          ← Back to Sessions
        </Link>
      </div>
    );
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return "N/A";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <Link
          href="/dashboard/sessions"
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontSize: "0.875rem",
            marginBottom: "1rem",
            display: "inline-block",
          }}
        >
          ← Back to Sessions
        </Link>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "0.5rem",
          }}
        >
          Session: {session.session_id.substring(0, 30)}...
        </h1>
        <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
          User: {session.user_id || "N/A"} • Started:{" "}
          {new Date(session.started_at).toLocaleString()}
          {session.ended_at && ` • Ended: ${new Date(session.ended_at).toLocaleString()}`}
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
              }}
            >
              Total Messages
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#111827",
              }}
            >
              {analytics.totalMessages}
            </div>
          </div>
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
              }}
            >
              Total Tokens
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#111827",
              }}
            >
              {Number(analytics.totalTokens || 0).toLocaleString()}
            </div>
          </div>
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
              }}
            >
              Duration
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#111827",
              }}
            >
              {formatDuration(analytics.duration)}
            </div>
          </div>
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
              }}
            >
              Issue Rate
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: (analytics.issueCount || 0) > 0 ? "#ef4444" : "#10b981",
              }}
            >
              {analytics.issueCount || 0}
            </div>
          </div>
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
              }}
            >
              Hallucination Rate
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#111827",
              }}
            >
              {Number(analytics.hallucinationRate || 0).toFixed(1)}%
            </div>
          </div>
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
              }}
            >
              Avg Latency
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#111827",
              }}
            >
              {Number(analytics.averageLatency || 0).toFixed(0)}ms
            </div>
          </div>
        </div>
      )}

      {/* Traces */}
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "1rem",
          }}
        >
          Traces ({traces.length})
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {traces.map((trace, index) => (
            <div
              key={trace.trace_id}
              style={{
                backgroundColor: "#fff",
                padding: "1.5rem",
                borderRadius: "0.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    fontWeight: 600,
                  }}
                >
                  Trace #{index + 1}
                  {trace.message_index !== null && ` (Message ${trace.message_index})`}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {trace.is_hallucination && (
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        backgroundColor: "#fee2e2",
                        color: "#991b1b",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                      }}
                    >
                      Hallucination
                    </span>
                  )}
                  {trace.has_context_drop && (
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        backgroundColor: "#fef3c7",
                        color: "#92400e",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                      }}
                    >
                      Context Drop
                    </span>
                  )}
                  {trace.has_faithfulness_issue && (
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        backgroundColor: "#fce7f3",
                        color: "#9f1239",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                      }}
                    >
                      Faithfulness
                    </span>
                  )}
                </div>
              </div>

              {trace.query && (
                <div style={{ marginBottom: "1rem" }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      marginBottom: "0.25rem",
                      fontWeight: 600,
                    }}
                  >
                    QUERY
                  </div>
                  <div
                    style={{
                      padding: "0.75rem",
                      backgroundColor: "#f9fafb",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                      color: "#111827",
                    }}
                  >
                    {trace.query}
                  </div>
                </div>
              )}

              {trace.response && (
                <div style={{ marginBottom: "1rem" }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      marginBottom: "0.25rem",
                      fontWeight: 600,
                    }}
                  >
                    RESPONSE
                  </div>
                  <div
                    style={{
                      padding: "0.75rem",
                      backgroundColor: "#f0f9ff",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                      color: "#111827",
                    }}
                  >
                    {trace.response}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  fontSize: "0.75rem",
                  color: "#6b7280",
                }}
              >
                {trace.model && (
                  <span>Model: {trace.model}</span>
                )}
                {trace.timestamp && (
                  <span>
                    {new Date(trace.timestamp).toLocaleString()}
                  </span>
                )}
                <Link
                  href={`/dashboard/traces/${trace.trace_id}`}
                  style={{
                    color: "#2563eb",
                    textDecoration: "none",
                  }}
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


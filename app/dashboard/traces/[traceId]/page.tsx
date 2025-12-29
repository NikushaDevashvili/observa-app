"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface TraceDetail {
  traceId: string;
  tenantId: string;
  projectId: string;
  analyzedAt: string;
  // ALL original trace data - every field
  spanId?: string | null;
  parentSpanId?: string | null;
  query?: string | null;
  context?: string | null;
  response?: string | null;
  model?: string | null;
  tokensPrompt?: number | null;
  tokensCompletion?: number | null;
  tokensTotal?: number | null;
  latencyMs?: number | null;
  timeToFirstTokenMs?: number | null;
  streamingDurationMs?: number | null;
  responseLength?: number | null;
  status?: number | null;
  statusText?: string | null;
  finishReason?: string | null;
  responseId?: string | null;
  systemFingerprint?: string | null;
  metadata?: Record<string, any> | null;
  headers?: Record<string, string> | null;
  timestamp?: string | null;
  environment?: string | null;
  // Analysis results
  analysis: {
    isHallucination: boolean | null;
    hallucinationConfidence: number | null;
    hallucinationReasoning: string | null;
    qualityScore: number | null;
    coherenceScore: number | null;
    relevanceScore: number | null;
    helpfulnessScore: number | null;
    hasContextDrop: boolean;
    hasModelDrift: boolean;
    hasPromptInjection: boolean;
    hasContextOverflow: boolean;
    hasFaithfulnessIssue: boolean;
    hasCostAnomaly: boolean;
    hasLatencyAnomaly: boolean;
    hasQualityDegradation: boolean;
    contextRelevanceScore: string | null;
    answerFaithfulnessScore: number | null;
    driftScore: number | null;
    anomalyScore: number | null;
    analysisModel: string | null;
    analysisVersion: string;
    processingTimeMs: number | null;
  };
}

export default function TraceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const traceId = params.traceId as string;
  const [trace, setTrace] = useState<TraceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrace = async () => {
      try {
        const token = localStorage.getItem("sessionToken");
        if (!token) {
          router.push("/auth/login");
          return;
        }

        const response = await fetch(`/api/traces/${traceId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.trace) {
            setTrace(data.trace);
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

  const IssueCard = ({
    title,
    hasIssue,
    score,
    description,
    reasoning,
    color,
    showPercentage = true,
  }: {
    title: string;
    hasIssue: boolean;
    score?: number | string | null;
    description?: string | null;
    reasoning?: string | null;
    color: string;
    showPercentage?: boolean;
  }) => (
    <div
      style={{
        backgroundColor: "#fff",
        padding: "1.5rem",
        borderRadius: "0.5rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        borderLeft: `4px solid ${hasIssue ? color : "#e5e5e5"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827" }}>
          {title}
        </h3>
        <span
          style={{
            padding: "0.25rem 0.75rem",
            borderRadius: "0.25rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            backgroundColor: hasIssue ? `${color}20` : "#f3f4f6",
            color: hasIssue ? color : "#6b7280",
          }}
        >
          {hasIssue ? "⚠️ Issue Detected" : "✓ No Issue"}
        </span>
      </div>
      
      {/* Score/Confidence with percentage */}
      {score !== null && score !== undefined && (
        <div style={{ marginBottom: "0.75rem" }}>
          <div
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              marginBottom: "0.25rem",
            }}
          >
            {showPercentage ? "Confidence" : "Score"}
          </div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: hasIssue ? color : "#111827",
            }}
          >
            {typeof score === "number"
              ? showPercentage
                ? `${(score * 100).toFixed(1)}%`
                : `${(score * 100).toFixed(1)}%`
              : typeof score === "string"
              ? parseFloat(score) !== NaN
                ? `${(parseFloat(score) * 100).toFixed(1)}%`
                : score
              : score}
          </div>
          {/* Visual progress bar */}
          {typeof score === "number" && (
            <div
              style={{
                width: "100%",
                height: "6px",
                backgroundColor: "#e5e5e5",
                borderRadius: "3px",
                marginTop: "0.5rem",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, score * 100)}%`,
                  height: "100%",
                  backgroundColor: hasIssue ? color : "#10b981",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Reasoning/Description */}
      {reasoning && (
        <div
          style={{
            fontSize: "0.875rem",
            color: "#6b7280",
            marginTop: "0.75rem",
            padding: "0.75rem",
            backgroundColor: "#f9fafb",
            borderRadius: "0.375rem",
            lineHeight: "1.5",
          }}
        >
          <strong style={{ color: "#111827" }}>Reasoning:</strong> {reasoning}
        </div>
      )}
      {description && !reasoning && (
        <div
          style={{
            fontSize: "0.875rem",
            color: "#6b7280",
            marginTop: "0.75rem",
            padding: "0.75rem",
            backgroundColor: "#f9fafb",
            borderRadius: "0.375rem",
            lineHeight: "1.5",
          }}
        >
          {description}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <div>Loading trace...</div>
      </div>
    );
  }

  if (!trace) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "0.5rem",
          }}
        >
          Trace Not Found
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
          The trace you're looking for doesn't exist or you don't have access to
          it.
        </p>
        <Link
          href="/dashboard/traces"
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#2563eb",
            color: "#fff",
            borderRadius: "0.375rem",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          Back to Traces
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <Link
          href="/dashboard/traces"
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontSize: "0.875rem",
            marginBottom: "1rem",
            display: "inline-block",
          }}
        >
          ← Back to Traces
        </Link>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#111827",
            marginTop: "0.5rem",
            marginBottom: "0.5rem",
          }}
        >
          Trace Details
        </h1>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            fontSize: "0.875rem",
            color: "#6b7280",
          }}
        >
          <div>
            <strong>Trace ID:</strong>{" "}
            <code
              style={{
                backgroundColor: "#f3f4f6",
                padding: "0.25rem 0.5rem",
                borderRadius: "0.25rem",
              }}
            >
              {trace.traceId}
            </code>
          </div>
          {trace.timestamp && (
            <div>
              <strong>Timestamp:</strong>{" "}
              {new Date(trace.timestamp).toLocaleString()}
            </div>
          )}
          <div>
            <strong>Analyzed:</strong>{" "}
            {new Date(trace.analyzedAt).toLocaleString()}
          </div>
          {trace.environment && (
            <div>
              <strong>Environment:</strong>{" "}
              <span style={{ textTransform: "uppercase", fontWeight: 600 }}>
                {trace.environment}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Original Trace Data */}
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "1rem",
          }}
        >
          Trace Data
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          {trace.model && (
            <div
              style={{
                backgroundColor: "#fff",
                padding: "1rem",
                borderRadius: "0.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                Model
              </div>
              <div
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                {trace.model}
              </div>
            </div>
          )}
          {trace.latencyMs !== null && trace.latencyMs !== undefined && (
            <div
              style={{
                backgroundColor: "#fff",
                padding: "1rem",
                borderRadius: "0.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                Total Latency
              </div>
              <div
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                {trace.latencyMs}ms
                {trace.analysis.hasLatencyAnomaly && (
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      color: "#ef4444",
                      fontSize: "0.875rem",
                    }}
                  >
                    ⚠️ Anomaly
                  </span>
                )}
              </div>
              {trace.timeToFirstTokenMs && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#9ca3af",
                    marginTop: "0.25rem",
                  }}
                >
                  TTFB: {trace.timeToFirstTokenMs}ms
                </div>
              )}
              {trace.streamingDurationMs && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#9ca3af",
                  }}
                >
                  Streaming: {trace.streamingDurationMs}ms
                </div>
              )}
            </div>
          )}
          {trace.status !== null && trace.status !== undefined && (
            <div
              style={{
                backgroundColor: "#fff",
                padding: "1rem",
                borderRadius: "0.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                HTTP Status
              </div>
              <div
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color:
                    trace.status >= 200 && trace.status < 300
                      ? "#10b981"
                      : "#ef4444",
                }}
              >
                {trace.status} {trace.statusText || ""}
              </div>
            </div>
          )}
          {trace.finishReason && (
            <div
              style={{
                backgroundColor: "#fff",
                padding: "1rem",
                borderRadius: "0.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                Finish Reason
              </div>
              <div
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                {trace.finishReason}
              </div>
            </div>
          )}
          {trace.responseId && (
            <div
              style={{
                backgroundColor: "#fff",
                padding: "1rem",
                borderRadius: "0.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                Response ID
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  fontFamily: "monospace",
                  color: "#111827",
                  wordBreak: "break-all",
                }}
              >
                {trace.responseId}
              </div>
            </div>
          )}
          {trace.systemFingerprint && (
            <div
              style={{
                backgroundColor: "#fff",
                padding: "1rem",
                borderRadius: "0.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                System Fingerprint
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  fontFamily: "monospace",
                  color: "#111827",
                  wordBreak: "break-all",
                }}
              >
                {trace.systemFingerprint}
              </div>
            </div>
          )}
          {trace.tokensTotal !== null && trace.tokensTotal !== undefined && (
            <div
              style={{
                backgroundColor: "#fff",
                padding: "1rem",
                borderRadius: "0.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                Total Tokens
              </div>
              <div
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                {trace.tokensTotal.toLocaleString()}
                {trace.analysis.hasCostAnomaly && (
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      color: "#ef4444",
                      fontSize: "0.875rem",
                    }}
                  >
                    ⚠️ Anomaly
                  </span>
                )}
              </div>
              {(trace.tokensPrompt || trace.tokensCompletion) && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#9ca3af",
                    marginTop: "0.25rem",
                  }}
                >
                  {trace.tokensPrompt &&
                    `Prompt: ${trace.tokensPrompt.toLocaleString()}`}
                  {trace.tokensPrompt && trace.tokensCompletion && " • "}
                  {trace.tokensCompletion &&
                    `Completion: ${trace.tokensCompletion.toLocaleString()}`}
                </div>
              )}
            </div>
          )}
          {trace.responseLength !== null &&
            trace.responseLength !== undefined && (
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    marginBottom: "0.25rem",
                  }}
                >
                  Response Length
                </div>
                <div
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {trace.responseLength.toLocaleString()} chars
                </div>
              </div>
            )}
        </div>

        {/* Query, Context, Response */}
        {trace.query && (
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              marginBottom: "1rem",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "#111827",
                marginBottom: "0.75rem",
              }}
            >
              Query
            </h3>
            <div
              style={{
                backgroundColor: "#f9fafb",
                padding: "1rem",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                color: "#111827",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {trace.query}
            </div>
          </div>
        )}

        {trace.context && (
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              marginBottom: "1rem",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "#111827",
                marginBottom: "0.75rem",
              }}
            >
              Context
              {trace.analysis.hasContextDrop && (
                <span
                  style={{
                    marginLeft: "0.5rem",
                    color: "#ef4444",
                    fontSize: "0.875rem",
                  }}
                >
                  ⚠️ Context Drop Detected
                </span>
              )}
            </h3>
            <div
              style={{
                backgroundColor: "#f9fafb",
                padding: "1rem",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                color: "#111827",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {trace.context}
            </div>
          </div>
        )}

        {trace.response && (
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              marginBottom: "1rem",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "#111827",
                marginBottom: "0.75rem",
              }}
            >
              Response
              {trace.analysis.isHallucination && (
                <span
                  style={{
                    marginLeft: "0.5rem",
                    color: "#ef4444",
                    fontSize: "0.875rem",
                  }}
                >
                  ⚠️ Hallucination Detected
                </span>
              )}
              {trace.analysis.hasFaithfulnessIssue && (
                <span
                  style={{
                    marginLeft: "0.5rem",
                    color: "#8b5cf6",
                    fontSize: "0.875rem",
                  }}
                >
                  ⚠️ Faithfulness Issue
                </span>
              )}
            </h3>
            <div
              style={{
                backgroundColor: "#f9fafb",
                padding: "1rem",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                color: "#111827",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              {trace.response}
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <IssueCard
          title="Hallucination Detection"
          hasIssue={trace.analysis.isHallucination === true}
          score={trace.analysis.hallucinationConfidence}
          reasoning={trace.analysis.hallucinationReasoning || undefined}
          color="#ef4444"
          showPercentage={true}
        />
        <IssueCard
          title="Context Drop Detection"
          hasIssue={trace.analysis.hasContextDrop}
          score={
            trace.analysis.contextRelevanceScore
              ? parseFloat(trace.analysis.contextRelevanceScore)
              : null
          }
          description={
            trace.analysis.contextRelevanceScore
              ? `Context relevance score indicates how well the query matches the provided context. Lower scores suggest potential context drops.`
              : undefined
          }
          color="#f59e0b"
          showPercentage={true}
        />
        <IssueCard
          title="Answer Faithfulness"
          hasIssue={trace.analysis.hasFaithfulnessIssue}
          score={trace.analysis.answerFaithfulnessScore}
          description={
            trace.analysis.answerFaithfulnessScore !== null
              ? `Measures how faithful the answer is to the provided context. Higher scores indicate better adherence to context.`
              : undefined
          }
          color="#8b5cf6"
          showPercentage={true}
        />
        <IssueCard
          title="Model Drift Detection"
          hasIssue={trace.analysis.hasModelDrift}
          score={trace.analysis.driftScore}
          description={
            trace.analysis.driftScore !== null
              ? `Detects changes in model behavior over time. Higher scores indicate potential model drift.`
              : undefined
          }
          color="#ec4899"
          showPercentage={true}
        />
        <IssueCard
          title="Cost Anomaly Detection"
          hasIssue={trace.analysis.hasCostAnomaly}
          score={trace.analysis.anomalyScore}
          description={
            trace.analysis.anomalyScore !== null
              ? `Identifies unusual token usage patterns that may indicate cost anomalies.`
              : undefined
          }
          color="#14b8a6"
          showPercentage={true}
        />
        <IssueCard
          title="Overall Quality Score"
          hasIssue={false}
          score={
            trace.analysis.qualityScore !== null
              ? trace.analysis.qualityScore / 100
              : null
          }
          description={
            trace.analysis.qualityScore !== null
              ? `Composite quality score based on coherence, relevance, and helpfulness metrics.`
              : undefined
          }
          color="#10b981"
          showPercentage={true}
        />
      </div>

      {/* Additional Metrics */}
      {(trace.analysis.coherenceScore !== null ||
        trace.analysis.relevanceScore !== null ||
        trace.analysis.helpfulnessScore !== null) && (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "1.5rem",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              color: "#111827",
              marginBottom: "1rem",
            }}
          >
            Quality Metrics
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            {trace.analysis.coherenceScore !== null && (
              <div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    marginBottom: "0.25rem",
                  }}
                >
                  Coherence
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color: "#111827",
                  }}
                >
                  {(trace.analysis.coherenceScore * 100).toFixed(1)}%
                </div>
              </div>
            )}
            {trace.analysis.relevanceScore !== null && (
              <div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    marginBottom: "0.25rem",
                  }}
                >
                  Relevance
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color: "#111827",
                  }}
                >
                  {(trace.analysis.relevanceScore * 100).toFixed(1)}%
                </div>
              </div>
            )}
            {trace.analysis.helpfulnessScore !== null && (
              <div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    marginBottom: "0.25rem",
                  }}
                >
                  Helpfulness
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color: "#111827",
                  }}
                >
                  {(trace.analysis.helpfulnessScore * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Trace Metadata */}
      {(trace.metadata || trace.headers) && (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "1.5rem",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              color: "#111827",
              marginBottom: "1rem",
            }}
          >
            Additional Metadata
          </h2>
          {trace.metadata && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: "0.75rem",
                }}
              >
                Metadata
              </h3>
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  padding: "1rem",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  fontFamily: "monospace",
                  color: "#111827",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {JSON.stringify(trace.metadata, null, 2)}
              </div>
            </div>
          )}
          {trace.headers && (
            <div>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: "0.75rem",
                }}
              >
                Headers
              </h3>
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  padding: "1rem",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  fontFamily: "monospace",
                  color: "#111827",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {JSON.stringify(trace.headers, null, 2)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analysis Metadata */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: "1.5rem",
          borderRadius: "0.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "1rem",
          }}
        >
          Analysis Metadata
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            fontSize: "0.875rem",
          }}
        >
          <div>
            <div style={{ color: "#6b7280", marginBottom: "0.25rem" }}>
              Analysis Model
            </div>
            <div style={{ color: "#111827", fontWeight: 500 }}>
              {trace.analysis.analysisModel || "N/A"}
            </div>
          </div>
          <div>
            <div style={{ color: "#6b7280", marginBottom: "0.25rem" }}>
              Analysis Version
            </div>
            <div style={{ color: "#111827", fontWeight: 500 }}>
              {trace.analysis.analysisVersion}
            </div>
          </div>
          <div>
            <div style={{ color: "#6b7280", marginBottom: "0.25rem" }}>
              Processing Time
            </div>
            <div style={{ color: "#111827", fontWeight: 500 }}>
              {trace.analysis.processingTimeMs
                ? `${trace.analysis.processingTimeMs}ms`
                : "N/A"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

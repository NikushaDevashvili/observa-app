"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SafeText } from "@/components/SafeHTML";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

interface TraceDetail {
  traceId: string;
  tenantId: string;
  projectId: string;
  analyzedAt: string;
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
  status?: number | null;
  statusText?: string | null;
  finishReason?: string | null;
  responseId?: string | null;
  systemFingerprint?: string | null;
  metadata?: Record<string, any> | null;
  headers?: Record<string, string> | null;
  timestamp?: string | null;
  environment?: string | null;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div>Loading trace...</div>
      </div>
    );
  }

  if (!trace) {
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

  const IssueCard = ({
    title,
    hasIssue,
    score,
    description,
    reasoning,
    color,
  }: {
    title: string;
    hasIssue: boolean;
    score?: number | string | null;
    description?: string | null;
    reasoning?: string | null;
    color: string;
  }) => (
    <Card className={hasIssue ? `border-l-4 border-l-[${color}]` : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge variant={hasIssue ? "destructive" : "secondary"}>
            {hasIssue ? (
              <>
                <AlertCircle className="mr-1 h-3 w-3" />
                Issue Detected
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                No Issue
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {score !== null && score !== undefined && (
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-1">Confidence</div>
            <div className="text-3xl font-bold" style={{ color: hasIssue ? color : undefined }}>
              {typeof score === "number"
                ? `${(score * 100).toFixed(1)}%`
                : typeof score === "string"
                ? !isNaN(parseFloat(score))
                  ? `${(parseFloat(score) * 100).toFixed(1)}%`
                  : score
                : score}
            </div>
            {typeof score === "number" && (
              <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${Math.min(100, score * 100)}%`,
                    backgroundColor: hasIssue ? color : "#10b981",
                  }}
                />
              </div>
            )}
          </div>
        )}
        {reasoning && (
          <div className="text-sm">
            <strong>Reasoning:</strong> <SafeText content={reasoning} />
          </div>
        )}
        {description && !reasoning && (
          <div className="text-sm text-muted-foreground">
            <SafeText content={description} />
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/traces">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Traces
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Trace Details</h1>
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
          <div>
            <strong>Trace ID:</strong>{" "}
            <code className="bg-muted px-2 py-1 rounded text-xs">{trace.traceId}</code>
          </div>
          {trace.timestamp && (
            <div>
              <strong>Timestamp:</strong> {new Date(trace.timestamp).toLocaleString()}
            </div>
          )}
          <div>
            <strong>Analyzed:</strong> {new Date(trace.analyzedAt).toLocaleString()}
          </div>
          {trace.environment && (
            <div>
              <strong>Environment:</strong>{" "}
              <Badge variant="outline" className="ml-1">
                {trace.environment.toUpperCase()}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Trace Metadata */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {trace.model && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Model</CardDescription>
              <CardTitle className="text-lg">{trace.model}</CardTitle>
            </CardHeader>
          </Card>
        )}
        {trace.latencyMs !== null && trace.latencyMs !== undefined && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Latency</CardDescription>
              <CardTitle className="text-lg">
                {trace.latencyMs}ms
                {trace.analysis.hasLatencyAnomaly && (
                  <Badge variant="destructive" className="ml-2">
                    Anomaly
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trace.timeToFirstTokenMs && (
                <div className="text-xs text-muted-foreground">
                  TTFB: {trace.timeToFirstTokenMs}ms
                </div>
              )}
              {trace.streamingDurationMs && (
                <div className="text-xs text-muted-foreground">
                  Streaming: {trace.streamingDurationMs}ms
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {trace.status !== null && trace.status !== undefined && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>HTTP Status</CardDescription>
              <CardTitle
                className={`text-lg ${
                  trace.status >= 200 && trace.status < 300
                    ? "text-green-600"
                    : "text-destructive"
                }`}
              >
                {trace.status} {trace.statusText || ""}
              </CardTitle>
            </CardHeader>
          </Card>
        )}
        {trace.tokensTotal !== null && trace.tokensTotal !== undefined && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Tokens</CardDescription>
              <CardTitle className="text-lg">
                {trace.tokensTotal.toLocaleString()}
                {trace.analysis.hasCostAnomaly && (
                  <Badge variant="destructive" className="ml-2">
                    Anomaly
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(trace.tokensPrompt || trace.tokensCompletion) && (
                <div className="text-xs text-muted-foreground">
                  {trace.tokensPrompt && `Prompt: ${trace.tokensPrompt.toLocaleString()}`}
                  {trace.tokensPrompt && trace.tokensCompletion && " • "}
                  {trace.tokensCompletion &&
                    `Completion: ${trace.tokensCompletion.toLocaleString()}`}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Query, Context, Response */}
      <div className="grid gap-4">
        {trace.query && (
          <Card>
            <CardHeader>
              <CardTitle>Query</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md">
                <SafeText content={trace.query} preserveWhitespace />
              </div>
            </CardContent>
          </Card>
        )}

        {trace.context && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Context</CardTitle>
                {trace.analysis.hasContextDrop && (
                  <Badge variant="destructive">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Context Drop Detected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md max-h-72 overflow-y-auto">
                <SafeText content={trace.context} preserveWhitespace />
              </div>
            </CardContent>
          </Card>
        )}

        {trace.response && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Response</CardTitle>
                {trace.analysis.isHallucination && (
                  <Badge variant="destructive">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Hallucination
                  </Badge>
                )}
                {trace.analysis.hasFaithfulnessIssue && (
                  <Badge variant="secondary">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Faithfulness Issue
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
                <SafeText content={trace.response} preserveWhitespace />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Analysis Results */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <IssueCard
            title="Hallucination Detection"
            hasIssue={trace.analysis.isHallucination === true}
            score={trace.analysis.hallucinationConfidence}
            reasoning={trace.analysis.hallucinationReasoning || undefined}
            color="#ef4444"
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
                ? "Context relevance score indicates how well the query matches the provided context."
                : undefined
            }
            color="#f59e0b"
          />
          <IssueCard
            title="Answer Faithfulness"
            hasIssue={trace.analysis.hasFaithfulnessIssue}
            score={trace.analysis.answerFaithfulnessScore}
            description="Measures how faithful the answer is to the provided context."
            color="#8b5cf6"
          />
          <IssueCard
            title="Model Drift Detection"
            hasIssue={trace.analysis.hasModelDrift}
            score={trace.analysis.driftScore}
            description="Detects changes in model behavior over time."
            color="#ec4899"
          />
          <IssueCard
            title="Cost Anomaly Detection"
            hasIssue={trace.analysis.hasCostAnomaly}
            score={trace.analysis.anomalyScore}
            description="Identifies unusual token usage patterns."
            color="#14b8a6"
          />
          <IssueCard
            title="Overall Quality Score"
            hasIssue={false}
            score={
              trace.analysis.qualityScore !== null
                ? trace.analysis.qualityScore / 100
                : null
            }
            description="Composite quality score based on coherence, relevance, and helpfulness."
            color="#10b981"
          />
        </div>
      </div>

      {/* Additional Metadata */}
      {(trace.metadata || trace.headers) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trace.metadata && (
              <div>
                <h3 className="text-sm font-medium mb-2">Metadata</h3>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-72">
                  {JSON.stringify(trace.metadata, null, 2)}
                </pre>
              </div>
            )}
            {trace.headers && (
              <div>
                <h3 className="text-sm font-medium mb-2">Headers</h3>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-72">
                  {JSON.stringify(trace.headers, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  AlertCircle,
  DollarSign,
  Eye,
  ArrowRight,
  CheckCircle2,
  Zap,
  Info,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import TimeRangeFilter, { TimeRange } from "@/components/dashboard/TimeRangeFilter";
import ProjectFilter from "@/components/dashboard/ProjectFilter";
import EnhancedMetricCard from "@/components/dashboard/EnhancedMetricCard";
import AlertsBanner from "@/components/dashboard/AlertsBanner";
import MetricsChart from "@/components/dashboard/MetricsChart";

interface DashboardMetrics {
  error_rate: {
    rate: number;
    total: number;
    errors: number;
    error_types: Record<string, number>;
  };
  latency: {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
    min: number;
    max: number;
  };
  cost: {
    total: number;
    avg_per_trace: number;
    by_model: Record<string, number>;
    by_route: Record<string, number>;
  };
  active_issues: {
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  tokens: {
    total: number;
    avg_per_trace: number;
    input: number;
    output: number;
    by_model: Record<string, { total: number; avg: number }>;
  };
  success_rate: number;
  trace_count: number;
  feedback?: {
    total: number;
    likes: number;
    dislikes: number;
    ratings: number;
    corrections: number;
    feedback_rate: number;
    avg_rating: number;
    with_comments: number;
    by_outcome: {
      success: number;
      failure: number;
      partial: number;
      unknown: number;
    };
    by_type: {
      like: number;
      dislike: number;
      rating: number;
      correction: number;
    };
  };
}

interface DashboardResponse {
  success: boolean;
  period: {
    start: string;
    end: string;
  };
  metrics: DashboardMetrics;
  health?: {
    overall: "healthy" | "warning" | "critical";
    indicators: {
      error_rate: { status: string; threshold: number; value: number };
      latency: { status: string; threshold: number; value: number };
      active_issues: { status: string; threshold: number; value: number };
    };
  };
  top_issues?: Array<{
    signal_name: string;
    count: number;
    severity: string;
    latest_timestamp: string;
  }>;
  top_models?: Array<{
    model: string;
    trace_count: number;
    cost: number;
    tokens: number;
  }>;
}

interface TimeSeriesData {
  timestamp: string;
  latency: { p50: number; p95: number; p99: number };
  error_rate: number;
  cost: number;
  tokens: number;
  trace_count: number;
  feedback?: {
    total: number;
    likes: number;
    dislikes: number;
    feedback_rate: number;
  };
}

interface ComparisonData {
  trace_count: { current: number; previous: number; change: number; change_percent: number };
  error_rate: { current: number; previous: number; change: number; change_percent: number };
  latency_p95: { current: number; previous: number; change: number; change_percent: number };
  cost: { current: number; previous: number; change: number; change_percent: number };
  tokens: { current: number; previous: number; change: number; change_percent: number };
}

interface Trace {
  trace_id: string;
  is_hallucination: boolean | null;
  hallucination_confidence: number | null;
  has_context_drop: boolean;
  has_faithfulness_issue: boolean;
  has_model_drift: boolean;
  has_cost_anomaly: boolean;
  context_relevance_score: string | null;
  answer_faithfulness_score: number | null;
  analyzed_at: string;
}

interface Alert {
  signal_name: string;
  severity: "high" | "medium" | "low";
  count: number;
  latest_timestamp: string;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [startTime, setStartTime] = useState<string>();
  const [endTime, setEndTime] = useState<string>();
  const [projectId, setProjectId] = useState<string>();
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);

  const fetchProjects = useCallback(async () => {
    // TODO: Fetch projects from API
    setProjects([]);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!startTime || !endTime) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("sessionToken");
      if (!token) return;

      // Build query params
      const params = new URLSearchParams();
      if (startTime) params.append("startTime", startTime);
      if (endTime) params.append("endTime", endTime);
      if (projectId) params.append("projectId", projectId);

      const requests = [
        fetch(`/api/dashboard/overview?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
        fetch(`/api/dashboard/overview/time-series?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
        fetch(`/api/dashboard/overview/comparison?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
        fetch("/api/dashboard/alerts?hours=24", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
        fetch("/api/traces?limit=10", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
      ];

      const results = await Promise.allSettled(requests);

      // Parse all JSON responses in parallel to eliminate sequential parsing
      const [
        metricsResponse,
        timeSeriesResponse,
        comparisonResponse,
        alertsResponse,
        tracesResponse,
      ] = results;

      const parsePromises = [
        metricsResponse.status === "fulfilled" && metricsResponse.value.ok
          ? metricsResponse.value.json().then((data: DashboardResponse) => {
              if (data.success && data.metrics) {
                setMetrics(data.metrics);
              }
            })
          : Promise.resolve(),
        timeSeriesResponse.status === "fulfilled" && timeSeriesResponse.value.ok
          ? timeSeriesResponse.value.json().then((data: any) => {
              if (data.success && data.series) {
                setTimeSeries(data.series);
              }
            })
          : Promise.resolve(),
        comparisonResponse.status === "fulfilled" && comparisonResponse.value.ok
          ? comparisonResponse.value.json().then((data: any) => {
              if (data.success && data.comparison) {
                setComparison(data.comparison);
              }
            })
          : Promise.resolve(),
        alertsResponse.status === "fulfilled" && alertsResponse.value.ok
          ? alertsResponse.value.json().then((data: any) => {
              if (data.success && data.alerts) {
                setAlerts(data.alerts);
              }
            })
          : Promise.resolve(),
        tracesResponse.status === "fulfilled" && tracesResponse.value.ok
          ? tracesResponse.value.json().then((data: any) => {
              if (data.success && data.traces) {
                setTraces(data.traces);
              }
            })
          : Promise.resolve(),
      ];

      await Promise.all(parsePromises);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [startTime, endTime, projectId]);

  useEffect(() => {
    // Set default time range (last 7 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    setStartTime(start.toISOString());
    setEndTime(end.toISOString());
    
    fetchDashboardData();
    fetchProjects();
  }, [fetchDashboardData, fetchProjects]);

  useEffect(() => {
    if (startTime && endTime) {
      fetchDashboardData();
    }
  }, [startTime, endTime, projectId, fetchDashboardData]);

  // Memoize handler to avoid recreating on every render
  const handleTimeRangeChange = useCallback((
    range: TimeRange,
    start?: string,
    end?: string
  ) => {
    setTimeRange(range);
    if (start && end) {
      setStartTime(start);
      setEndTime(end);
    }
  }, []);

  const IssueBadge = ({
    hasIssue,
    label,
  }: {
    hasIssue: boolean;
    label: string;
  }) => {
    if (!hasIssue) return null;
    return (
      <Badge variant="destructive" className="mr-1">
        {label}
      </Badge>
    );
  };

  if (loading && !metrics) {
    return (
      <div className="mx-4 py-4">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const healthStatus = metrics
    ? (metrics.active_issues.high > 0
        ? "critical"
        : metrics.error_rate.rate > 5
        ? "warning"
        : "healthy")
    : "healthy";

  return (
    <div className="mx-4">
      {/* Header with Filters */}
      <div className="flex flex-row justify-between items-center py-4">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-gray-500 pt-1">
            Monitor your AI application's performance and quality
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TimeRangeFilter
            value={timeRange}
            onChange={handleTimeRangeChange}
            customStartTime={startTime}
            customEndTime={endTime}
          />
          <ProjectFilter
            projects={projects}
            selectedProjectId={projectId}
            onChange={setProjectId}
          />
        </div>
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <AlertsBanner alerts={alerts} />
      )}

      {/* Summary Section */}
      {metrics && (
        <div className="p-6 border-1 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <h2 className="text-sm font-medium">System Health</h2>
            </div>
            <Badge
              className={
                healthStatus === "healthy"
                  ? "bg-green-100 text-green-800"
                  : healthStatus === "warning"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }
            >
              {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">Error Rate</div>
              <div className="font-medium">
                {metrics.error_rate.rate.toFixed(2)}%{" "}
                {metrics.error_rate.rate < 1 ? (
                  <span className="text-green-600">✓ Good</span>
                ) : metrics.error_rate.rate < 5 ? (
                  <span className="text-yellow-600">⚠ Warning</span>
                ) : (
                  <span className="text-red-600">✗ Critical</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">P95 Latency</div>
              <div className="font-medium">
                {metrics.latency.p95.toFixed(0)}ms{" "}
                {metrics.latency.p95 < 1000 ? (
                  <span className="text-green-600">✓ Good</span>
                ) : metrics.latency.p95 < 5000 ? (
                  <span className="text-yellow-600">⚠ Warning</span>
                ) : (
                  <span className="text-red-600">✗ Critical</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Active Issues</div>
              <div className="font-medium">
                {metrics.active_issues.total} total (
                {metrics.active_issues.high} high, {metrics.active_issues.medium}{" "}
                medium)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4 mb-6">
        <EnhancedMetricCard
          title="Total Traces"
          value={metrics?.trace_count || 0}
          icon={<Activity className="h-5 w-5" />}
          tooltip={`Total traces in selected period`}
          trend={
            comparison
              ? {
                  value: comparison.trace_count.change_percent,
                  period: "vs previous period",
                }
              : undefined
          }
          status={
            metrics
              ? metrics.trace_count === 0
                ? "warning"
                : "healthy"
              : undefined
          }
        />
        <EnhancedMetricCard
          title="Success Rate"
          value={`${metrics?.success_rate.toFixed(1) || 0}%`}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          tooltip={`${metrics?.success_rate.toFixed(2) || 0}% of traces succeeded`}
          trend={
            comparison
              ? {
                  value: -comparison.error_rate.change_percent, // Inverse of error rate change
                  period: "vs previous period",
                }
              : undefined
          }
          status={
            metrics
              ? metrics.success_rate > 99
                ? "healthy"
                : metrics.success_rate > 95
                ? "warning"
                : "critical"
              : undefined
          }
        />
        <EnhancedMetricCard
          title="Error Rate"
          value={`${metrics?.error_rate.rate.toFixed(1) || 0}%`}
          icon={<AlertCircle className="h-5 w-5 text-destructive" />}
          tooltip={`${metrics?.error_rate.errors || 0} errors out of ${
            metrics?.error_rate.total || 0
          } traces`}
          trend={
            comparison
              ? {
                  value: comparison.error_rate.change_percent,
                  period: "vs previous period",
                }
              : undefined
          }
          status={
            metrics
              ? metrics.error_rate.rate < 1
                ? "healthy"
                : metrics.error_rate.rate < 5
                ? "warning"
                : "critical"
              : undefined
          }
        />
        <EnhancedMetricCard
          title="Active Issues"
          value={metrics?.active_issues.total || 0}
          icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
          tooltip={`${metrics?.active_issues.high || 0} high, ${
            metrics?.active_issues.medium || 0
          } medium, ${metrics?.active_issues.low || 0} low`}
          status={
            metrics
              ? metrics.active_issues.high > 0
                ? "critical"
                : metrics.active_issues.medium > 0
                ? "warning"
                : "healthy"
              : undefined
          }
        />
      </div>

      {/* Feedback Metrics Row */}
      {metrics?.feedback && metrics.feedback.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4 mb-6">
          <EnhancedMetricCard
            title="User Feedback"
            value={metrics.feedback.total}
            icon={<MessageSquare className="h-5 w-5 text-blue-600" />}
            tooltip={`${metrics.feedback.total} total feedback events (${metrics.feedback.feedback_rate.toFixed(1)}% of traces)`}
            status={
              metrics.feedback.feedback_rate > 10
                ? "healthy"
                : metrics.feedback.feedback_rate > 5
                ? "warning"
                : "critical"
            }
          />
          <EnhancedMetricCard
            title="Likes"
            value={metrics.feedback.likes}
            icon={<ThumbsUp className="h-5 w-5 text-green-600" />}
            tooltip={`${metrics.feedback.likes} positive feedback (${metrics.feedback.total > 0 ? ((metrics.feedback.likes / metrics.feedback.total) * 100).toFixed(1) : 0}% of feedback)`}
            status={
              metrics.feedback.total > 0 && metrics.feedback.likes / metrics.feedback.total > 0.7
                ? "healthy"
                : metrics.feedback.total > 0 && metrics.feedback.likes / metrics.feedback.total > 0.5
                ? "warning"
                : "critical"
            }
          />
          <EnhancedMetricCard
            title="Dislikes"
            value={metrics.feedback.dislikes}
            icon={<ThumbsDown className="h-5 w-5 text-red-600" />}
            tooltip={`${metrics.feedback.dislikes} negative feedback (${metrics.feedback.total > 0 ? ((metrics.feedback.dislikes / metrics.feedback.total) * 100).toFixed(1) : 0}% of feedback)`}
            status={
              metrics.feedback.total > 0 && metrics.feedback.dislikes / metrics.feedback.total < 0.2
                ? "healthy"
                : metrics.feedback.total > 0 && metrics.feedback.dislikes / metrics.feedback.total < 0.3
                ? "warning"
                : "critical"
            }
          />
          <EnhancedMetricCard
            title="Feedback Rate"
            value={`${metrics.feedback.feedback_rate.toFixed(1)}%`}
            icon={<Activity className="h-5 w-5 text-purple-600" />}
            tooltip={`${metrics.feedback.feedback_rate.toFixed(2)}% of traces received user feedback`}
            status={
              metrics.feedback.feedback_rate > 10
                ? "healthy"
                : metrics.feedback.feedback_rate > 5
                ? "warning"
                : "critical"
            }
          />
        </div>
      )}

      {/* Feedback Details Card */}
      {metrics?.feedback && metrics.feedback.total > 0 && (
        <div className="p-6 border-1 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-4 w-4" />
            <h2 className="text-sm font-medium">User Feedback Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">Total Feedback</div>
              <div className="font-medium">{metrics.feedback.total}</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Like/Dislike Ratio</div>
              <div className="font-medium">
                {metrics.feedback.dislikes > 0
                  ? (metrics.feedback.likes / metrics.feedback.dislikes).toFixed(2)
                  : metrics.feedback.likes > 0
                  ? "∞"
                  : "0"}
                :1
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Average Rating</div>
              <div className="font-medium">
                {metrics.feedback.avg_rating > 0
                  ? `${metrics.feedback.avg_rating.toFixed(1)}/5`
                  : "N/A"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">With Comments</div>
              <div className="font-medium">
                {metrics.feedback.with_comments} (
                {metrics.feedback.total > 0
                  ? ((metrics.feedback.with_comments / metrics.feedback.total) * 100).toFixed(1)
                  : 0}
                %)
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground mb-2">Feedback by Outcome</div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-green-600">Success:</span> {metrics.feedback.by_outcome.success}
              </div>
              <div>
                <span className="text-red-600">Failure:</span> {metrics.feedback.by_outcome.failure}
              </div>
              <div>
                <span className="text-yellow-600">Partial:</span> {metrics.feedback.by_outcome.partial}
              </div>
              <div>
                <span className="text-gray-600">Unknown:</span> {metrics.feedback.by_outcome.unknown}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row 1: Latency + Error Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <MetricsChart
          title="Latency Over Time"
          data={timeSeries}
          type="latency"
          height={300}
        />
        <MetricsChart
          title="Error Rate Over Time"
          data={timeSeries}
          type="error_rate"
          height={300}
        />
      </div>

      {/* Charts Row 2: Cost + Tokens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <MetricsChart
          title="Cost Over Time"
          data={timeSeries}
          type="cost"
          height={300}
        />
        <MetricsChart
          title="Token Usage Over Time"
          data={timeSeries}
          type="tokens"
          height={300}
        />
      </div>

      {/* Charts Row 3: Feedback (if available) */}
      {timeSeries.some((d) => d.feedback && d.feedback.total > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <MetricsChart
            title="Feedback Over Time"
            data={timeSeries}
            type="feedback"
            height={300}
          />
        </div>
      )}

      {/* Recent Traces */}
      <div className="py-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-semibold text-lg">Recent Traces</h1>
          <Link href="/dashboard/traces">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="rounded-none">
          {traces.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground rounded-md border">
              <p>
                No traces yet. Start sending traces to see analysis results
                here.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trace ID</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Analyzed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {traces.map((trace) => {
                    const hasAnyIssue =
                      trace.is_hallucination === true ||
                      trace.has_context_drop ||
                      trace.has_faithfulness_issue ||
                      trace.has_model_drift ||
                      trace.has_cost_anomaly;

                    return (
                      <TableRow key={trace.trace_id}>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {trace.trace_id.substring(0, 12)}...
                          </code>
                        </TableCell>
                        <TableCell>
                          {hasAnyIssue ? (
                            <div className="flex flex-wrap gap-1">
                              <IssueBadge
                                hasIssue={trace.is_hallucination === true}
                                label="Hallucination"
                              />
                              <IssueBadge
                                hasIssue={trace.has_context_drop}
                                label="Context Drop"
                              />
                              <IssueBadge
                                hasIssue={trace.has_faithfulness_issue}
                                label="Faithfulness"
                              />
                              <IssueBadge
                                hasIssue={trace.has_model_drift}
                                label="Drift"
                              />
                              <IssueBadge
                                hasIssue={trace.has_cost_anomaly}
                                label="Cost"
                              />
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              ✓ No issues
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {trace.hallucination_confidence !== null ? (
                            <span
                              className={
                                trace.hallucination_confidence > 0.7
                                  ? "text-destructive font-medium"
                                  : ""
                              }
                            >
                              {(trace.hallucination_confidence * 100).toFixed(
                                0
                              )}
                              %
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(trace.analyzed_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/traces/${trace.trace_id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

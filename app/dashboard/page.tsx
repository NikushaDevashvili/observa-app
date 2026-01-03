"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StatisticsCard from "@/components/StatisticsCard";
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
  TrendingUp,
  Eye,
  ArrowRight,
  Clock,
  CheckCircle2,
  TrendingDown,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7"); // days - default to 7 days to show more data

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) return;

      // Fetch dashboard overview metrics
      const metricsResponse = await fetch(
        `/api/dashboard/overview?days=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        if (metricsData.success && metricsData.metrics) {
          setMetrics(metricsData.metrics);
        }
      }

      // Fetch recent traces
      const tracesResponse = await fetch("/api/traces?limit=10", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (tracesResponse.ok) {
        const tracesData = await tracesResponse.json();
        if (tracesData.success && tracesData.traces) {
          setTraces(tracesData.traces);
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-4">
        <div className="flex flex-row justify-between items-center">
          <div className="py-4">
            <h1 className="text-xl">Dashboard</h1>
            <p className="text-gray-500 pt-1">
              Monitor your AI application's performance and quality
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeRange === "1" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("1")}
            >
              24h
            </Button>
            <Button
              variant={timeRange === "7" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("7")}
            >
              7d
            </Button>
            <Button
              variant={timeRange === "30" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("30")}
            >
              30d
            </Button>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4 mb-6">
          <StatisticsCard
            title="Total Traces"
            value={metrics?.trace_count || 0}
            icon={<Activity className="h-5 w-5" />}
            tooltip={`Total traces in the last ${timeRange} day(s)`}
          />
          <StatisticsCard
            title="Success Rate"
            value={`${metrics?.success_rate.toFixed(1) || 0}%`}
            icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
            tooltip={`${
              metrics?.success_rate.toFixed(2) || 0
            }% of traces succeeded`}
          />
          <StatisticsCard
            title="Error Rate"
            value={`${metrics?.error_rate.rate.toFixed(1) || 0}%`}
            icon={<AlertCircle className="h-5 w-5 text-destructive" />}
            tooltip={`${metrics?.error_rate.errors || 0} errors out of ${
              metrics?.error_rate.total || 0
            } traces`}
          />
          <StatisticsCard
            title="Active Issues"
            value={metrics?.active_issues.total || 0}
            icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
            tooltip={`${metrics?.active_issues.high || 0} high, ${
              metrics?.active_issues.medium || 0
            } medium, ${metrics?.active_issues.low || 0} low`}
          />
        </div>

        {/* Performance Metrics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Latency
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.latency ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">P50</span>
                    <span className="font-medium">
                      {metrics.latency.p50.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">P95</span>
                    <span className="font-medium">
                      {metrics.latency.p95.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">P99</span>
                    <span className="font-medium">
                      {metrics.latency.p99.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground text-sm">Avg</span>
                    <span className="font-medium">
                      {metrics.latency.avg.toFixed(0)}ms
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  No latency data
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.cost ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Total</span>
                    <span className="font-medium">
                      ${metrics.cost.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Avg/Trace
                    </span>
                    <span className="font-medium">
                      ${metrics.cost.avg_per_trace.toFixed(4)}
                    </span>
                  </div>
                  {Object.keys(metrics.cost.by_model).length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground mb-1">
                        Top Model
                      </div>
                      {Object.entries(metrics.cost.by_model)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 1)
                        .map(([model, cost]) => (
                          <div key={model} className="flex justify-between">
                            <span className="text-xs truncate">{model}</span>
                            <span className="text-xs font-medium">
                              ${cost.toFixed(2)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  No cost data
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.tokens ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Total</span>
                    <span className="font-medium">
                      {(metrics.tokens.total / 1000).toFixed(1)}k
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Avg/Trace
                    </span>
                    <span className="font-medium">
                      {metrics.tokens.avg_per_trace.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t">
                    <span className="text-muted-foreground">
                      In: {(metrics.tokens.input / 1000).toFixed(1)}k
                    </span>
                    <span className="text-muted-foreground">
                      Out: {(metrics.tokens.output / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  No token data
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
    </>
  );
}

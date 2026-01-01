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
} from "lucide-react";

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
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    hallucinations: 0,
    contextDrops: 0,
    faithfulnessIssues: 0,
    modelDrift: 0,
    costAnomalies: 0,
  });

  useEffect(() => {
    const fetchTraces = async () => {
      try {
        const token = localStorage.getItem("sessionToken");
        if (!token) return;

        const response = await fetch("/api/traces?limit=10", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.traces) {
            setTraces(data.traces);

            // Calculate stats from pagination total if available, otherwise from traces
            const total = data.pagination?.total || data.traces.length;
            const hallucinations = data.traces.filter(
              (t: Trace) => t.is_hallucination === true
            ).length;
            const contextDrops = data.traces.filter(
              (t: Trace) => t.has_context_drop === true
            ).length;
            const faithfulnessIssues = data.traces.filter(
              (t: Trace) => t.has_faithfulness_issue === true
            ).length;
            const modelDrift = data.traces.filter(
              (t: Trace) => t.has_model_drift === true
            ).length;
            const costAnomalies = data.traces.filter(
              (t: Trace) => t.has_cost_anomaly === true
            ).length;

            setStats({
              total,
              hallucinations,
              contextDrops,
              faithfulnessIssues,
              modelDrift,
              costAnomalies,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch traces:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTraces();
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
            <p className="text-gray-500 pt-">Monitor your AI application's performance and quality</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4">
          <StatisticsCard
            title="Total Traces"
            value={stats.total}
            icon={<Activity className="h-5 w-5" />}
          />
          <StatisticsCard
            title="Hallucinations"
            value={stats.hallucinations}
            tooltip={`${stats.total > 0 ? Math.round((stats.hallucinations / stats.total) * 100) : 0}% of all traces`}
            icon={<AlertCircle className="h-5 w-5 text-destructive" />}
          />
          <StatisticsCard
            title="Context Drops"
            value={stats.contextDrops}
            tooltip={`${stats.total > 0 ? Math.round((stats.contextDrops / stats.total) * 100) : 0}% of all traces`}
            icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
          />
          <StatisticsCard
            title="Faithfulness Issues"
            value={stats.faithfulnessIssues}
            tooltip={`${stats.total > 0 ? Math.round((stats.faithfulnessIssues / stats.total) * 100) : 0}% of all traces`}
            icon={<AlertCircle className="h-5 w-5 text-purple-500" />}
          />
          <StatisticsCard
            title="Model Drift"
            value={stats.modelDrift}
            tooltip={`${stats.total > 0 ? Math.round((stats.modelDrift / stats.total) * 100) : 0}% of all traces`}
            icon={<TrendingUp className="h-5 w-5 text-pink-500" />}
          />
          <StatisticsCard
            title="Cost Anomalies"
            value={stats.costAnomalies}
            tooltip={`${stats.total > 0 ? Math.round((stats.costAnomalies / stats.total) * 100) : 0}% of all traces`}
            icon={<DollarSign className="h-5 w-5 text-teal-500" />}
          />
        </div>
        <div className="py-6">
          <h1 className="font-semibold text-lg pt-6">Recent Traces</h1>
          <div className="rounded-none ">
            {traces.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p>No traces yet. Start sending traces to see analysis results here.</p>
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
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
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
                                {(trace.hallucination_confidence * 100).toFixed(0)}%
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

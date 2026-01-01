"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DataTable from "@/components/tables/DataTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StatisticsCard from "@/components/StatisticsCard";
import {
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  DollarSign,
  Zap,
  Eye,
  ExternalLink,
  ArrowUpDown,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

interface Issue {
  trace_id: string;
  issue_type:
    | "hallucination"
    | "context_drop"
    | "faithfulness"
    | "drift"
    | "cost_anomaly";
  severity: "high" | "medium" | "low";
  confidence?: number | null;
  timestamp: string;
  model?: string | null;
  latency_ms?: number | null;
  tokens_total?: number | null;
}

interface IssueStats {
  total: number;
  hallucinations: number;
  contextDrops: number;
  faithfulnessIssues: number;
  modelDrift: number;
  costAnomalies: number;
  highSeverity: number;
}

export default function IssuesPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<IssueStats>({
    total: 0,
    hallucinations: 0,
    contextDrops: 0,
    faithfulnessIssues: 0,
    modelDrift: 0,
    costAnomalies: 0,
    highSeverity: 0,
  });
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchIssues();
  }, [filter]);

  const fetchIssues = async () => {
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) return;

      // For now, we'll fetch traces and filter for issues
      // TODO: Create a dedicated issues API endpoint
      const params = new URLSearchParams({
        limit: "100", // Get more traces to find issues
        offset: "0",
      });

      if (filter !== "all") {
        params.append("issueType", filter);
      }

      const response = await fetch(`/api/traces?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.traces) {
          // Convert traces with issues to issue records
          const issuesList: Issue[] = [];
          const statsData: IssueStats = {
            total: 0,
            hallucinations: 0,
            contextDrops: 0,
            faithfulnessIssues: 0,
            modelDrift: 0,
            costAnomalies: 0,
            highSeverity: 0,
          };

          data.traces.forEach((trace: any) => {
            const traceIssues: Issue[] = [];

            if (trace.is_hallucination === true) {
              traceIssues.push({
                trace_id: trace.trace_id,
                issue_type: "hallucination",
                severity:
                  (trace.hallucination_confidence || 0) > 0.7
                    ? "high"
                    : "medium",
                confidence: trace.hallucination_confidence,
                timestamp: trace.timestamp || trace.analyzed_at,
                model: trace.model,
                latency_ms: trace.latency_ms,
                tokens_total: trace.tokens_total,
              });
              statsData.hallucinations++;
            }

            if (trace.has_context_drop) {
              traceIssues.push({
                trace_id: trace.trace_id,
                issue_type: "context_drop",
                severity: "medium",
                timestamp: trace.timestamp || trace.analyzed_at,
                model: trace.model,
                latency_ms: trace.latency_ms,
                tokens_total: trace.tokens_total,
              });
              statsData.contextDrops++;
            }

            if (trace.has_faithfulness_issue) {
              traceIssues.push({
                trace_id: trace.trace_id,
                issue_type: "faithfulness",
                severity: "medium",
                confidence: trace.answer_faithfulness_score,
                timestamp: trace.timestamp || trace.analyzed_at,
                model: trace.model,
                latency_ms: trace.latency_ms,
                tokens_total: trace.tokens_total,
              });
              statsData.faithfulnessIssues++;
            }

            if (trace.has_model_drift) {
              traceIssues.push({
                trace_id: trace.trace_id,
                issue_type: "drift",
                severity: "low",
                timestamp: trace.timestamp || trace.analyzed_at,
                model: trace.model,
                latency_ms: trace.latency_ms,
                tokens_total: trace.tokens_total,
              });
              statsData.modelDrift++;
            }

            if (trace.has_cost_anomaly) {
              traceIssues.push({
                trace_id: trace.trace_id,
                issue_type: "cost_anomaly",
                severity: "medium",
                timestamp: trace.timestamp || trace.analyzed_at,
                model: trace.model,
                latency_ms: trace.latency_ms,
                tokens_total: trace.tokens_total,
              });
              statsData.costAnomalies++;
            }

            issuesList.push(...traceIssues);
          });

          // Sort by timestamp (newest first)
          issuesList.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          statsData.total = issuesList.length;
          statsData.highSeverity = issuesList.filter(
            (i) => i.severity === "high"
          ).length;

          setIssues(issuesList);
          setStats(statsData);
        }
      }
    } catch (error) {
      console.error("Failed to fetch issues:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIssueTypeLabel = (type: Issue["issue_type"]) => {
    const labels = {
      hallucination: "Hallucination",
      context_drop: "Context Drop",
      faithfulness: "Faithfulness",
      drift: "Model Drift",
      cost_anomaly: "Cost Anomaly",
    };
    return labels[type];
  };

  const getIssueTypeColor = (type: Issue["issue_type"]) => {
    const colors = {
      hallucination: "destructive",
      context_drop: "secondary",
      faithfulness: "secondary",
      drift: "secondary",
      cost_anomaly: "secondary",
    } as const;
    return colors[type];
  };

  const getSeverityColor = (severity: Issue["severity"]) => {
    const colors = {
      high: "destructive",
      medium: "default",
      low: "secondary",
    } as const;
    return colors[severity];
  };

  const issueColumns: ColumnDef<Issue>[] = [
    {
      accessorKey: "trace_id",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Trace ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const traceId = row.getValue("trace_id") as string;
        return (
          <code className="bg-muted px-2 py-1 rounded text-xs">
            {traceId.substring(0, 12)}...
          </code>
        );
      },
    },
    {
      accessorKey: "issue_type",
      header: "Issue Type",
      cell: ({ row }) => {
        const issueType = row.getValue("issue_type") as Issue["issue_type"];
        return (
          <Badge variant={getIssueTypeColor(issueType)}>
            {getIssueTypeLabel(issueType)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "severity",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Severity
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const severity = row.getValue("severity") as Issue["severity"];
        return (
          <Badge variant={getSeverityColor(severity)}>
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "confidence",
      header: "Confidence",
      cell: ({ row }) => {
        const confidence = row.getValue("confidence") as
          | number
          | null
          | undefined;
        if (confidence === null || confidence === undefined) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <span
            className={confidence > 0.7 ? "text-destructive font-medium" : ""}
          >
            {(confidence * 100).toFixed(0)}%
          </span>
        );
      },
    },
    {
      accessorKey: "model",
      header: "Model",
      cell: ({ row }) => {
        const model = row.getValue("model") as string | undefined;
        return model ? (
          <span className="text-sm">{model}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "timestamp",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Timestamp
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const timestamp = row.getValue("timestamp") as string;
        return (
          <span className="text-sm">
            {new Date(timestamp).toLocaleString()}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const issue = row.original;
        return (
          <Link href={`/dashboard/traces/${issue.trace_id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              View Trace
            </Button>
          </Link>
        );
      },
    },
  ];

  const handleRowClick = (row: Issue) => {
    router.push(`/dashboard/traces/${row.trace_id}`);
  };

  const filterButtons = [
    { id: "all", label: "All Issues", variant: "outline" as const },
    {
      id: "hallucination",
      label: "Hallucinations",
      variant: "destructive" as const,
    },
    {
      id: "context_drop",
      label: "Context Drops",
      variant: "secondary" as const,
    },
    {
      id: "faithfulness",
      label: "Faithfulness",
      variant: "secondary" as const,
    },
    { id: "drift", label: "Model Drift", variant: "secondary" as const },
    {
      id: "cost_anomaly",
      label: "Cost Anomalies",
      variant: "secondary" as const,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div>Loading issues...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Issues</h1>
        <p className="text-muted-foreground">
          Track and monitor issues across your AI application
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatisticsCard
          title="Total Issues"
          value={stats.total}
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
        />
        <StatisticsCard
          title="High Severity"
          value={stats.highSeverity}
          tooltip="Issues with high confidence or severity"
          icon={<AlertCircle className="h-5 w-5 text-destructive" />}
        />
        <StatisticsCard
          title="Hallucinations"
          value={stats.hallucinations}
          icon={<AlertCircle className="h-5 w-5 text-red-500" />}
        />
        <StatisticsCard
          title="Context Drops"
          value={stats.contextDrops}
          icon={<TrendingDown className="h-5 w-5 text-orange-500" />}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatisticsCard
          title="Faithfulness Issues"
          value={stats.faithfulnessIssues}
          icon={<Zap className="h-5 w-5 text-purple-500" />}
        />
        <StatisticsCard
          title="Model Drift"
          value={stats.modelDrift}
          icon={<TrendingDown className="h-5 w-5 text-pink-500" />}
        />
        <StatisticsCard
          title="Cost Anomalies"
          value={stats.costAnomalies}
          icon={<DollarSign className="h-5 w-5 text-teal-500" />}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter issues by type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((btn) => (
              <Button
                key={btn.id}
                variant={filter === btn.id ? btn.variant : "outline"}
                onClick={() => setFilter(btn.id)}
                size="sm"
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Issues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Issues</CardTitle>
          <CardDescription>
            {filter !== "all" && `Showing ${filter} issues`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No issues found</p>
              <p>
                {filter !== "all"
                  ? `No ${filter} issues detected. Your AI application is performing well!`
                  : "No issues detected. Your AI application is performing well!"}
              </p>
            </div>
          ) : (
            <DataTable
              columns={issueColumns}
              data={issues}
              filterColumn="trace_id"
              filterPlaceholder="Filter by trace ID..."
              enableColumnVisibility={true}
              enableSorting={true}
              enablePagination={true}
              pageSize={25}
              height="h-[600px]"
              onRowClick={handleRowClick}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

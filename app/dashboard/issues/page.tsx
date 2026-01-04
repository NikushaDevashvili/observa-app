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
  timestamp: string;
  issue_type: string;
  severity: "high" | "medium" | "low";
  trace_id: string;
  span_id: string;
  details: Record<string, any>;
  signal_value: number | boolean | string;
  signal_type: string;
}

interface IssueStats {
  total: number;
  high: number;
  medium: number;
  low: number;
}

export default function IssuesPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<IssueStats>({
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
  });
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [signalTypeFilter, setSignalTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchIssues();
  }, [severityFilter, signalTypeFilter]);

  const fetchIssues = async () => {
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) return;

      // Use 7-day time range to capture recent issues
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const params = new URLSearchParams({
        limit: "100",
        offset: "0",
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      });

      if (severityFilter !== "all") {
        params.append("severity", severityFilter);
      }

      const response = await fetch(`/api/issues?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.issues) {
          let filteredIssues = data.issues;

          // Filter by signal type if specified
          if (signalTypeFilter !== "all") {
            filteredIssues = filteredIssues.filter(
              (issue: Issue) => issue.issue_type === signalTypeFilter
            );
          }

          setIssues(filteredIssues);

          // Calculate stats
          const statsData: IssueStats = {
            total: filteredIssues.length,
            high: filteredIssues.filter((i: Issue) => i.severity === "high")
              .length,
            medium: filteredIssues.filter((i: Issue) => i.severity === "medium")
              .length,
            low: filteredIssues.filter((i: Issue) => i.severity === "low")
              .length,
          };
          setStats(statsData);
        }
      }
    } catch (error) {
      console.error("Failed to fetch issues:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIssueTypeLabel = (type: string) => {
    // Convert snake_case to Title Case
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getIssueTypeColor = (type: string) => {
    if (type.includes("error") || type.includes("hallucination")) {
      return "destructive";
    }
    return "secondary";
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
        const issueType = row.getValue("issue_type") as string;
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
      accessorKey: "signal_value",
      header: "Value",
      cell: ({ row }) => {
        const value = row.getValue("signal_value");
        if (typeof value === "boolean") {
          return value ? "Yes" : "No";
        }
        if (typeof value === "number") {
          return value.toLocaleString();
        }
        return String(value);
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

  // Get unique signal types for filter
  const signalTypes = Array.from(
    new Set(issues.map((issue) => issue.issue_type))
  );

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
          value={stats.high}
          tooltip="Issues with high severity"
          icon={<AlertCircle className="h-5 w-5 text-destructive" />}
        />
        <StatisticsCard
          title="Medium Severity"
          value={stats.medium}
          tooltip="Issues with medium severity"
          icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
        />
        <StatisticsCard
          title="Low Severity"
          value={stats.low}
          tooltip="Issues with low severity"
          icon={<TrendingDown className="h-5 w-5 text-yellow-500" />}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter issues by severity and type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Severity</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={severityFilter === "all" ? "default" : "outline"}
                  onClick={() => setSeverityFilter("all")}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={
                    severityFilter === "high" ? "destructive" : "outline"
                  }
                  onClick={() => setSeverityFilter("high")}
                  size="sm"
                >
                  High
                </Button>
                <Button
                  variant={severityFilter === "medium" ? "default" : "outline"}
                  onClick={() => setSeverityFilter("medium")}
                  size="sm"
                >
                  Medium
                </Button>
                <Button
                  variant={severityFilter === "low" ? "secondary" : "outline"}
                  onClick={() => setSeverityFilter("low")}
                  size="sm"
                >
                  Low
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Issue Type
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={signalTypeFilter === "all" ? "default" : "outline"}
                  onClick={() => setSignalTypeFilter("all")}
                  size="sm"
                >
                  All Types
                </Button>
                {signalTypes.map((type) => (
                  <Button
                    key={type}
                    variant={signalTypeFilter === type ? "default" : "outline"}
                    onClick={() => setSignalTypeFilter(type)}
                    size="sm"
                  >
                    {getIssueTypeLabel(type)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Issues</CardTitle>
          <CardDescription>
            {severityFilter !== "all" &&
              `Showing ${severityFilter} severity issues`}
            {signalTypeFilter !== "all" &&
              ` - ${getIssueTypeLabel(signalTypeFilter)}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No issues found</p>
              <p>
                {severityFilter !== "all" || signalTypeFilter !== "all"
                  ? `No issues match the selected filters.`
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

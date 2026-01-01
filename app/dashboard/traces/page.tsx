"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DataTable, { DataTableProps } from "@/components/tables/DataTable";
import { traceColumns, Trace } from "@/components/tables/columns/trace-columns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StatisticsCard from "@/components/StatisticsCard";
import { Activity, AlertCircle, DollarSign, TrendingUp } from "lucide-react";

export default function TracesPage() {
  const router = useRouter();
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });
  const [stats, setStats] = useState({
    total: 0,
    hallucinations: 0,
    contextDrops: 0,
    faithfulnessIssues: 0,
    modelDrift: 0,
    costAnomalies: 0,
  });

  useEffect(() => {
    fetchTraces();
  }, [filter, pagination.offset]);

  const fetchTraces = async () => {
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) return;

      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
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
          setTraces(data.traces);
          setPagination((prev) => ({
            ...prev,
            total: data.pagination?.total || 0,
            hasMore: data.pagination?.hasMore || false,
          }));

          // Calculate stats
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

  const handleRowClick = (row: Trace) => {
    router.push(`/dashboard/traces/${row.trace_id}`);
  };

  const filterButtons = [
    { id: "all", label: "All", variant: "outline" as const },
    { id: "hallucination", label: "Hallucinations", variant: "destructive" as const },
    { id: "context_drop", label: "Context Drops", variant: "secondary" as const },
    { id: "faithfulness", label: "Faithfulness", variant: "secondary" as const },
    { id: "drift", label: "Model Drift", variant: "secondary" as const },
    { id: "cost_anomaly", label: "Cost Anomalies", variant: "secondary" as const },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div>Loading traces...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Traces</h1>
        <p className="text-muted-foreground">
          {pagination.total} total trace{pagination.total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          title="Cost Anomalies"
          value={stats.costAnomalies}
          tooltip={`${stats.total > 0 ? Math.round((stats.costAnomalies / stats.total) * 100) : 0}% of all traces`}
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter traces by issue type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((btn) => (
              <Button
                key={btn.id}
                variant={filter === btn.id ? btn.variant : "outline"}
                onClick={() => {
                  setFilter(btn.id);
                  setPagination((prev) => ({ ...prev, offset: 0 }));
                }}
                size="sm"
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Traces Table */}
      <Card>
        <CardHeader>
          <CardTitle>Traces</CardTitle>
          <CardDescription>
            {filter !== "all" && `Showing traces with ${filter} issues`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={traceColumns}
            data={traces}
            filterColumn="trace_id"
            filterPlaceholder="Filter by trace ID..."
            enableColumnVisibility={true}
            enableSorting={true}
            enablePagination={true}
            pageSize={pagination.limit}
            height="h-[600px]"
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>
    </div>
  );
}

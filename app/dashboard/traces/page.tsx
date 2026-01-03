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
  const [search, setSearch] = useState<string>("");
  const [environment, setEnvironment] = useState<string>("all");
  const [model, setModel] = useState<string>("all");
  const [availableModels, setAvailableModels] = useState<
    Array<{ model: string; count: number; lastSeen?: string | null }>
  >([]);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchTraces();
  }, [filter, pagination.offset, environment, model]);

  useEffect(() => {
    fetchModels();
  }, [environment]);

  const fetchTraces = async () => {
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) return;

      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        includeStats: "true",
      });

      if (filter !== "all") {
        params.append("issueType", filter);
      }

      if (environment !== "all") {
        params.append("environment", environment);
      }

      if (model !== "all") {
        params.append("model", model);
      }

      if (search.trim()) {
        params.append("search", search.trim());
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

          // Prefer server-side stats (Phase 2); fallback if missing
          if (data.stats) {
            setStats(data.stats);
          } else {
            const total = data.pagination?.total || data.traces.length;
            const hallucinations = data.traces.filter(
              (t: Trace) => t.is_hallucination === true
            ).length;
            const costAnomalies = data.traces.filter(
              (t: Trace) => t.has_cost_anomaly === true
            ).length;
            setStats({
              totalTraces: total,
              issueCount: hallucinations + costAnomalies,
              errorRate: 0,
              avgLatencyMs: null,
              totalCostUsd: null,
              avgQualityScore: null,
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch traces:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const token = localStorage.getItem("sessionToken");
      if (!token) return;

      const params = new URLSearchParams();
      if (environment !== "all") {
        params.append("environment", environment);
      }

      const resp = await fetch(`/api/traces/models?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resp.ok) return;
      const data = await resp.json();
      if (data?.success && Array.isArray(data.models)) {
        setAvailableModels(data.models);
      }
    } catch (e) {
      console.error("Failed to fetch models:", e);
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
          value={stats?.totalTraces ?? pagination.total}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatisticsCard
          title="Error Rate"
          value={`${(stats?.errorRate ?? 0).toFixed(1)}%`}
          tooltip="Percentage of traces with status >= 400"
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <StatisticsCard
          title="Total Cost"
          value={
            stats?.totalCostUsd === null || stats?.totalCostUsd === undefined
              ? "—"
              : `$${Number(stats.totalCostUsd).toFixed(2)}`
          }
          tooltip="Estimated total cost (token-based approximation)"
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter traces by issue type, env, and search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <input
                className="h-9 w-full md:w-[320px] rounded-md border bg-background px-3 text-sm"
                placeholder="Search query/response/context…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPagination((prev) => ({ ...prev, offset: 0 }));
                    fetchTraces();
                  }
                }}
              />
              <select
                className="h-9 w-full md:w-[260px] rounded-md border bg-background px-3 text-sm"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setPagination((prev) => ({ ...prev, offset: 0 }));
                }}
              >
                <option value="all">All models</option>
                {availableModels.map((m) => (
                  <option key={m.model} value={m.model}>
                    {m.model} ({m.count})
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={environment}
                onChange={(e) => {
                  setEnvironment(e.target.value);
                  setPagination((prev) => ({ ...prev, offset: 0 }));
                }}
              >
                <option value="all">All envs</option>
                <option value="prod">prod</option>
                <option value="dev">dev</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPagination((prev) => ({ ...prev, offset: 0 }));
                  fetchTraces();
                }}
              >
                Apply
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const token = localStorage.getItem("sessionToken");
                  if (!token) return;
                  const params = new URLSearchParams({
                    limit: "5000",
                    offset: "0",
                    format: "csv",
                  });
                  if (filter !== "all") params.append("issueType", filter);
                  if (environment !== "all") params.append("environment", environment);
                  if (model !== "all") params.append("model", model);
                  if (search.trim()) params.append("search", search.trim());

                  const resp = await fetch(`/api/traces/export?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!resp.ok) return;
                  const blob = await resp.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "traces-export.csv";
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                }}
              >
                Export CSV
              </Button>
            </div>

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

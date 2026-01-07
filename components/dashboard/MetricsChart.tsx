"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TimeSeriesData {
  timestamp: string;
  latency?: { p50: number; p95: number; p99: number };
  error_rate?: number;
  cost?: number;
  tokens?: number;
  trace_count?: number;
  feedback?: {
    total: number;
    likes: number;
    dislikes: number;
    feedback_rate: number;
  };
}

interface MetricsChartProps {
  title: string;
  data: TimeSeriesData[];
  type: "latency" | "error_rate" | "cost" | "tokens" | "feedback";
  height?: number;
}

export default function MetricsChart({
  title,
  data,
  type,
  height = 300,
}: MetricsChartProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: date.getHours() > 0 ? "numeric" : undefined,
    });
  };

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case "latency":
        return `${value.toFixed(0)}ms`;
      case "error_rate":
        return `${value.toFixed(2)}%`;
      case "cost":
        return `$${value.toFixed(2)}`;
      case "tokens":
        return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString();
      case "feedback":
        return value.toFixed(0);
      default:
        return value.toString();
    }
  };

  if (data.length === 0) {
    return (
      <div className="p-6 border-1">
        <h3 className="text-sm font-medium mb-4">{title}</h3>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No data available
        </div>
      </div>
    );
  }

  if (type === "latency") {
    return (
      <div className="p-6 border-1">
        <h3 className="text-sm font-medium mb-4">{title}</h3>
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimestamp}
                style={{ fontSize: "12px" }}
              />
              <YAxis
                tickFormatter={(value) => `${value}ms`}
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(0)}ms`}
                labelFormatter={formatTimestamp}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="latency.p50"
                stroke="#8884d8"
                name="P50"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="latency.p95"
                stroke="#82ca9d"
                name="P95"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="latency.p99"
                stroke="#ffc658"
                name="P99"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
      </div>
    );
  }

  if (type === "error_rate") {
    return (
      <div className="p-6 border-1">
        <h3 className="text-sm font-medium mb-4">{title}</h3>
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimestamp}
                style={{ fontSize: "12px" }}
              />
              <YAxis
                tickFormatter={(value) => `${value}%`}
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(2)}%`}
                labelFormatter={formatTimestamp}
              />
              <Area
                type="monotone"
                dataKey="error_rate"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorError)"
                name="Error Rate"
              />
            </AreaChart>
          </ResponsiveContainer>
      </div>
    );
  }

  if (type === "cost") {
    return (
      <div className="p-6 border-1">
        <h3 className="text-sm font-medium mb-4">{title}</h3>
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimestamp}
                style={{ fontSize: "12px" }}
              />
              <YAxis
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                formatter={(value: number) => `$${value.toFixed(2)}`}
                labelFormatter={formatTimestamp}
              />
              <Bar dataKey="cost" fill="#3b82f6" name="Cost" />
            </BarChart>
          </ResponsiveContainer>
      </div>
    );
  }

  if (type === "tokens") {
    return (
      <div className="p-6 border-1">
        <h3 className="text-sm font-medium mb-4">{title}</h3>
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimestamp}
                style={{ fontSize: "12px" }}
              />
              <YAxis
                tickFormatter={(value) =>
                  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()
                }
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                formatter={(value: number) =>
                  value >= 1000
                    ? `${(value / 1000).toFixed(1)}k tokens`
                    : `${value} tokens`
                }
                labelFormatter={formatTimestamp}
              />
              <Area
                type="monotone"
                dataKey="tokens"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorTokens)"
                name="Tokens"
              />
            </AreaChart>
          </ResponsiveContainer>
      </div>
    );
  }

  if (type === "feedback") {
    return (
      <div className="p-6 border-1">
        <h3 className="text-sm font-medium mb-4">{title}</h3>
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorFeedback" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDislikes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimestamp}
                style={{ fontSize: "12px" }}
              />
              <YAxis
                tickFormatter={(value) => value.toString()}
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "feedback.feedback_rate") {
                    return `${value.toFixed(2)}%`;
                  }
                  return value.toString();
                }}
                labelFormatter={formatTimestamp}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="feedback.total"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorFeedback)"
                name="Total Feedback"
              />
              <Area
                type="monotone"
                dataKey="feedback.likes"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorLikes)"
                name="Likes"
              />
              <Area
                type="monotone"
                dataKey="feedback.dislikes"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorDislikes)"
                name="Dislikes"
              />
            </AreaChart>
          </ResponsiveContainer>
      </div>
    );
  }

  return null;
}

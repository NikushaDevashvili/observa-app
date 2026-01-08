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
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

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

// Chart configurations for each type
const latencyChartConfig: ChartConfig = {
  p50: {
    label: "P50",
    color: "var(--chart-1)",
  },
  p95: {
    label: "P95",
    color: "var(--chart-2)",
  },
  p99: {
    label: "P99",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const errorRateChartConfig: ChartConfig = {
  error_rate: {
    label: "Error Rate",
    color: "var(--destructive)",
  },
} satisfies ChartConfig;

const costChartConfig: ChartConfig = {
  cost: {
    label: "Cost",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const tokensChartConfig: ChartConfig = {
  tokens: {
    label: "Tokens",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

const feedbackChartConfig: ChartConfig = {
  total: {
    label: "Total Feedback",
    color: "var(--chart-1)",
  },
  likes: {
    label: "Likes",
    color: "var(--chart-2)",
  },
  dislikes: {
    label: "Dislikes",
    color: "var(--destructive)",
  },
} satisfies ChartConfig;

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
        <ChartContainer config={latencyChartConfig} className="h-[300px] w-full">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              style={{ fontSize: "12px" }}
            />
            <YAxis
              tickFormatter={(value: any) => `${value}ms`}
              style={{ fontSize: "12px" }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value: any, name: any, item: any, index: number, payload: any) => {
                    if (typeof value === 'number') {
                      return `${value.toFixed(0)}ms`;
                    }
                    return value;
                  }}
                  labelFormatter={formatTimestamp}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey="latency.p50"
              stroke="var(--color-p50)"
              name="p50"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="latency.p95"
              stroke="var(--color-p95)"
              name="p95"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="latency.p99"
              stroke="var(--color-p99)"
              name="p99"
              strokeWidth={2}
            />
          </LineChart>
        </ChartContainer>
      </div>
    );
  }

  if (type === "error_rate") {
    return (
      <div className="p-6 border-1">
        <h3 className="text-sm font-medium mb-4">{title}</h3>
        <ChartContainer config={errorRateChartConfig} className="h-[300px] w-full">
          <AreaChart data={data}>
              <defs>
                <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0} />
                </linearGradient>
              </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              style={{ fontSize: "12px" }}
            />
            <YAxis
              tickFormatter={(value: any) => `${value}%`}
              style={{ fontSize: "12px" }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value: any, name: any, item: any, index: number, payload: any) => {
                    if (typeof value === 'number') {
                      return `${value.toFixed(2)}%`;
                    }
                    return value;
                  }}
                  labelFormatter={formatTimestamp}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="error_rate"
              stroke="var(--color-error_rate)"
              fillOpacity={1}
              fill="url(#colorError)"
              name="error_rate"
            />
          </AreaChart>
        </ChartContainer>
      </div>
    );
  }

  if (type === "cost") {
    return (
      <div className="p-6 border-1">
        <h3 className="text-sm font-medium mb-4">{title}</h3>
        <ChartContainer config={costChartConfig} className="h-[300px] w-full">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              style={{ fontSize: "12px" }}
            />
            <YAxis
              tickFormatter={(value: any) => `$${value.toFixed(2)}`}
              style={{ fontSize: "12px" }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value: any, name: any, item: any, index: number, payload: any) => {
                    if (typeof value === 'number') {
                      return `$${value.toFixed(2)}`;
                    }
                    return value;
                  }}
                  labelFormatter={formatTimestamp}
                />
              }
            />
            <Bar dataKey="cost" fill="var(--color-cost)" name="cost" />
          </BarChart>
        </ChartContainer>
      </div>
    );
  }

  if (type === "tokens") {
    return (
      <div className="p-6 border-1">
        <h3 className="text-sm font-medium mb-4">{title}</h3>
        <ChartContainer config={tokensChartConfig} className="h-[300px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-5)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              style={{ fontSize: "12px" }}
            />
            <YAxis
              tickFormatter={(value: any) =>
                value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()
              }
              style={{ fontSize: "12px" }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value: any, name: any, item: any, index: number, payload: any) => {
                    if (typeof value === 'number') {
                      return value >= 1000
                        ? `${(value / 1000).toFixed(1)}k tokens`
                        : `${value} tokens`;
                    }
                    return value;
                  }}
                  labelFormatter={formatTimestamp}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="tokens"
              stroke="var(--color-tokens)"
              fillOpacity={1}
              fill="url(#colorTokens)"
              name="tokens"
            />
          </AreaChart>
        </ChartContainer>
      </div>
    );
  }

  if (type === "feedback") {
    return (
      <div className="p-6 border-1">
        <h3 className="text-sm font-medium mb-4">{title}</h3>
        <ChartContainer config={feedbackChartConfig} className="h-[300px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorFeedback" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDislikes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              style={{ fontSize: "12px" }}
            />
            <YAxis
              tickFormatter={(value: any) => value.toString()}
              style={{ fontSize: "12px" }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value: any, name: any, item: any, index: number, payload: any) => {
                    if (typeof value === 'number') {
                      if (name?.includes("feedback_rate")) {
                        return `${value.toFixed(2)}%`;
                      }
                      return value.toString();
                    }
                    return value;
                  }}
                  labelFormatter={formatTimestamp}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="feedback.total"
              stroke="var(--color-total)"
              fillOpacity={1}
              fill="url(#colorFeedback)"
              name="total"
            />
            <Area
              type="monotone"
              dataKey="feedback.likes"
              stroke="var(--color-likes)"
              fillOpacity={1}
              fill="url(#colorLikes)"
              name="likes"
            />
            <Area
              type="monotone"
              dataKey="feedback.dislikes"
              stroke="var(--color-dislikes)"
              fillOpacity={1}
              fill="url(#colorDislikes)"
              name="dislikes"
            />
          </AreaChart>
        </ChartContainer>
      </div>
    );
  }

  return null;
}

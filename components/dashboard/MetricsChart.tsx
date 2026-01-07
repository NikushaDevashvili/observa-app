"use client";

import { LineChart, AreaChart, BarChart } from '@lobehub/charts';

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

  // Transform data for LobeHub charts
  const transformedData = data.map((item) => {
    const base: any = {
      timestamp: formatTimestamp(item.timestamp),
    };
    
    if (type === "latency" && item.latency) {
      base.p50 = item.latency.p50;
      base.p95 = item.latency.p95;
      base.p99 = item.latency.p99;
    } else if (type === "error_rate") {
      base.error_rate = item.error_rate || 0;
    } else if (type === "cost") {
      base.cost = item.cost || 0;
    } else if (type === "tokens") {
      base.tokens = item.tokens || 0;
    } else if (type === "feedback" && item.feedback) {
      base.total = item.feedback.total;
      base.likes = item.feedback.likes;
      base.dislikes = item.feedback.dislikes;
    }
    
    return base;
  });

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
        <div style={{ height: `${height}px` }}>
          <LineChart
            data={transformedData}
            xKey="timestamp"
            yKeys={['p50', 'p95', 'p99']}
            series={[
              { key: 'p50', label: 'P50', color: '#8884d8' },
              { key: 'p95', label: 'P95', color: '#82ca9d' },
              { key: 'p99', label: 'P99', color: '#ffc658' },
            ]}
          />
        </div>
      </div>
    );
  }

  if (type === "error_rate") {
    return (
      <div className="p-6 border-1">
        <h3 className="text-sm font-medium mb-4">{title}</h3>
        <div style={{ height: `${height}px` }}>
          <AreaChart
            data={transformedData}
            xKey="timestamp"
            yKeys={['error_rate']}
            series={[
              { key: 'error_rate', label: 'Error Rate', color: '#ef4444' },
            ]}
          />
        </div>
      </div>
    );
  }

  if (type === "cost") {
    return (
      <div className="p-6 border-1">
        <h3 className="text-sm font-medium mb-4">{title}</h3>
        <div style={{ height: `${height}px` }}>
          <BarChart
            data={transformedData}
            xKey="timestamp"
            yKeys={['cost']}
            series={[
              { key: 'cost', label: 'Cost', color: '#3b82f6' },
            ]}
          />
        </div>
      </div>
    );
  }

  if (type === "tokens") {
    return (
      <div className="p-6 border-1">
        <h3 className="text-sm font-medium mb-4">{title}</h3>
        <div style={{ height: `${height}px` }}>
          <AreaChart
            data={transformedData}
            xKey="timestamp"
            yKeys={['tokens']}
            series={[
              { key: 'tokens', label: 'Tokens', color: '#3b82f6' },
            ]}
          />
        </div>
      </div>
    );
  }

  if (type === "feedback") {
    return (
      <div className="p-6 border-1">
        <h3 className="text-sm font-medium mb-4">{title}</h3>
        <div style={{ height: `${height}px` }}>
          <AreaChart
            data={transformedData}
            xKey="timestamp"
            yKeys={['total', 'likes', 'dislikes']}
            series={[
              { key: 'total', label: 'Total Feedback', color: '#8b5cf6' },
              { key: 'likes', label: 'Likes', color: '#10b981' },
              { key: 'dislikes', label: 'Dislikes', color: '#ef4444' },
            ]}
          />
        </div>
      </div>
    );
  }

  return null;
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ReactNode } from "react";

interface EnhancedMetricCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number; // percentage change
    period: string; // e.g., "vs last 7d"
  };
  status?: "healthy" | "warning" | "critical";
  icon?: ReactNode;
  tooltip?: string;
  onClick?: () => void;
  sparkline?: number[]; // Last 7 data points for mini chart
}

export default function EnhancedMetricCard({
  title,
  value,
  trend,
  status,
  icon,
  tooltip,
  onClick,
  sparkline,
}: EnhancedMetricCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "healthy":
        return "🟢";
      case "warning":
        return "🟡";
      case "critical":
        return "🔴";
      default:
        return null;
    }
  };

  const formatValue = (val: string | number) => {
    if (typeof val === "number") {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}k`;
      }
      return val.toFixed(0);
    }
    return val;
  };

  const renderSparkline = () => {
    if (!sparkline || sparkline.length === 0) return null;

    const max = Math.max(...sparkline, 1);
    const min = Math.min(...sparkline, 0);
    const range = max - min || 1;

    const points = sparkline.map((val, idx) => {
      const x = (idx / (sparkline.length - 1 || 1)) * 100;
      const y = 100 - ((val - min) / range) * 100;
      return `${x},${y}`;
    });

    return (
      <svg
        className="w-full h-8 mt-2"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
        />
      </svg>
    );
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        onClick ? "hover:border-primary" : ""
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <div className="text-2xl font-bold mb-2">{formatValue(value)}</div>
              
              {trend && (
                <div className="flex items-center gap-1 text-sm mb-2">
                  {trend.value > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : trend.value < 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-400" />
                  )}
                  <span
                    className={
                      trend.value > 0
                        ? "text-green-600"
                        : trend.value < 0
                        ? "text-red-600"
                        : "text-gray-500"
                    }
                  >
                    {Math.abs(trend.value).toFixed(1)}% {trend.period}
                  </span>
                </div>
              )}

              {renderSparkline()}

              {status && (
                <div className="mt-2">
                  <Badge className={getStatusColor()}>
                    {getStatusIcon()} {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </div>
              )}
            </div>
          </TooltipTrigger>
          {tooltip && <TooltipContent>{tooltip}</TooltipContent>}
        </Tooltip>
      </CardContent>
    </Card>
  );
}



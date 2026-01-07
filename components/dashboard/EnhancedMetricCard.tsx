"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

  return (
    <div
      className={`p-6 border-1 items-center flex flex-row justify-between ${
        onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
      }`}
      onClick={onClick}
    >
      <div className="">
        <Tooltip>
          <TooltipTrigger className="flex flex-col items-start">
            <h1 className="pb-1">{title}</h1>
            <span className="text-xl">{formatValue(value)}</span>
            {trend && (
              <span className="text-xs text-muted-foreground mt-1">
                {trend.value > 0 ? "+" : ""}{trend.value.toFixed(1)}% {trend.period}
              </span>
            )}
          </TooltipTrigger>
          {tooltip && <TooltipContent>{tooltip}</TooltipContent>}
        </Tooltip>
      </div>
      {icon && <div className="border-1 p-4">{icon}</div>}
    </div>
  );
}



"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "lucide-react";
import { useState } from "react";

export type TimeRange = "24h" | "7d" | "30d" | "all" | "custom";

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (range: TimeRange, startTime?: string, endTime?: string) => void;
  customStartTime?: string;
  customEndTime?: string;
}

export default function TimeRangeFilter({
  value,
  onChange,
  customStartTime,
  customEndTime,
}: TimeRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [localStartTime, setLocalStartTime] = useState(
    customStartTime || ""
  );
  const [localEndTime, setLocalEndTime] = useState(customEndTime || "");

  const handleQuickSelect = (range: TimeRange) => {
    if (range === "custom") {
      setShowCustom(true);
      return;
    }

    setShowCustom(false);
    let startTime: string | undefined;
    let endTime: string | undefined;

    if (range !== "all") {
      const end = new Date();
      const start = new Date();

      switch (range) {
        case "24h":
          start.setHours(start.getHours() - 24);
          break;
        case "7d":
          start.setDate(start.getDate() - 7);
          break;
        case "30d":
          start.setDate(start.getDate() - 30);
          break;
      }

      startTime = start.toISOString();
      endTime = end.toISOString();
    }

    onChange(range, startTime, endTime);
  };

  const handleCustomApply = () => {
    if (localStartTime && localEndTime) {
      onChange("custom", localStartTime, localEndTime);
      setShowCustom(false);
    }
  };

  const getDisplayText = () => {
    switch (value) {
      case "24h":
        return "Last 24h";
      case "7d":
        return "Last 7d";
      case "30d":
        return "Last 30d";
      case "all":
        return "All Time";
      case "custom":
        return "Custom Range";
      default:
        return "Last 7d";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            {getDisplayText()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => handleQuickSelect("24h")}>
            Last 24 hours
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickSelect("7d")}>
            Last 7 days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickSelect("30d")}>
            Last 30 days
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickSelect("all")}>
            All Time
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickSelect("custom")}>
            Custom Range
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showCustom && (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
          <input
            type="datetime-local"
            value={localStartTime ? new Date(localStartTime).toISOString().slice(0, 16) : ""}
            onChange={(e) => {
              const value = e.target.value;
              setLocalStartTime(value ? new Date(value).toISOString() : "");
            }}
            className="text-sm border rounded px-2 py-1"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="datetime-local"
            value={localEndTime ? new Date(localEndTime).toISOString().slice(0, 16) : ""}
            onChange={(e) => {
              const value = e.target.value;
              setLocalEndTime(value ? new Date(value).toISOString() : "");
            }}
            className="text-sm border rounded px-2 py-1"
          />
          <Button size="sm" onClick={handleCustomApply}>
            Apply
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCustom(false)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}


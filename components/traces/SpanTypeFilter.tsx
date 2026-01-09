/**
 * Span Type Filter Component
 * Allows filtering traces by span type (LLM, Tool, Retrieval, Embedding, etc.)
 */

"use client";

import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { DEFAULT_SPAN_TYPE_FILTERS, type SpanType } from "@/types/trace";

interface SpanTypeFilterProps {
  selectedType: SpanType | "all";
  onTypeChange: (type: SpanType | "all") => void;
  counts?: Record<SpanType, number>;
}

export const SpanTypeFilter = ({
  selectedType,
  onTypeChange,
  counts,
}: SpanTypeFilterProps): ReactElement => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedType === "all" ? "default" : "outline"}
        size="sm"
        onClick={() => onTypeChange("all")}
      >
        All Types
        {counts && (
          <span className="ml-2 text-xs opacity-70">
            ({Object.values(counts).reduce((a, b) => a + b, 0)})
          </span>
        )}
      </Button>
      {DEFAULT_SPAN_TYPE_FILTERS.map((filter) => {
        const count = counts?.[filter.value];
        return (
          <Button
            key={filter.value}
            variant={selectedType === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => onTypeChange(filter.value)}
          >
            {filter.label}
            {count !== undefined && (
              <span className="ml-2 text-xs opacity-70">({count})</span>
            )}
          </Button>
        );
      })}
    </div>
  );
};



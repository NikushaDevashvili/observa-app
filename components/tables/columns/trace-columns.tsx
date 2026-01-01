"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import Link from "next/link";

export interface Trace {
  trace_id: string;
  is_hallucination: boolean | null;
  hallucination_confidence: number | null;
  has_context_drop: boolean;
  has_faithfulness_issue: boolean;
  has_model_drift: boolean;
  has_cost_anomaly: boolean;
  context_relevance_score: string | null;
  answer_faithfulness_score: number | null;
  analyzed_at: string;
  timestamp?: string;
  model?: string;
  latency_ms?: number;
  tokens_total?: number;
}

const IssueBadge = ({ hasIssue, label, variant }: { hasIssue: boolean; label: string; variant?: "destructive" | "secondary" | "outline" }) => {
  if (!hasIssue) return null;
  return (
    <Badge variant={variant || "destructive"} className="mr-1">
      {label}
    </Badge>
  );
};

export const traceColumns: ColumnDef<Trace>[] = [
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
      const timestamp = row.getValue("timestamp") as string | undefined;
      if (!timestamp) return <span className="text-muted-foreground">—</span>;
      return <span>{new Date(timestamp).toLocaleString()}</span>;
    },
  },
  {
    id: "issues",
    header: "Issues",
    cell: ({ row }) => {
      const trace = row.original;
      const hasAnyIssue =
        trace.is_hallucination === true ||
        trace.has_context_drop ||
        trace.has_faithfulness_issue ||
        trace.has_model_drift ||
        trace.has_cost_anomaly;

      if (!hasAnyIssue) {
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            ✓ No issues
          </Badge>
        );
      }

      return (
        <div className="flex flex-wrap gap-1">
          <IssueBadge hasIssue={trace.is_hallucination === true} label="Hallucination" />
          <IssueBadge hasIssue={trace.has_context_drop} label="Context Drop" variant="secondary" />
          <IssueBadge hasIssue={trace.has_faithfulness_issue} label="Faithfulness" variant="secondary" />
          <IssueBadge hasIssue={trace.has_model_drift} label="Drift" variant="secondary" />
          <IssueBadge hasIssue={trace.has_cost_anomaly} label="Cost" variant="secondary" />
        </div>
      );
    },
  },
  {
    accessorKey: "model",
    header: "Model",
    cell: ({ row }) => {
      const model = row.getValue("model") as string | undefined;
      if (!model) return <span className="text-muted-foreground">—</span>;
      return <span className="text-sm">{model}</span>;
    },
  },
  {
    accessorKey: "latency_ms",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Latency
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const latency = row.getValue("latency_ms") as number | undefined;
      if (latency === undefined || latency === null) {
        return <span className="text-muted-foreground">—</span>;
      }
      const isHigh = latency > 5000;
      return (
        <span className={isHigh ? "text-destructive font-medium" : ""}>
          {latency}ms
        </span>
      );
    },
  },
  {
    accessorKey: "tokens_total",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tokens
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const tokens = row.getValue("tokens_total") as number | undefined;
      if (tokens === undefined || tokens === null) {
        return <span className="text-muted-foreground">—</span>;
      }
      return <span>{tokens.toLocaleString()}</span>;
    },
  },
  {
    accessorKey: "hallucination_confidence",
    header: "Confidence",
    cell: ({ row }) => {
      const confidence = row.getValue("hallucination_confidence") as number | null;
      if (confidence === null || confidence === undefined) {
        return <span className="text-muted-foreground">—</span>;
      }
      const isHigh = confidence > 0.7;
      return (
        <span className={isHigh ? "text-destructive font-medium" : ""}>
          {(confidence * 100).toFixed(0)}%
        </span>
      );
    },
  },
  {
    accessorKey: "analyzed_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Analyzed
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const analyzedAt = row.getValue("analyzed_at") as string;
      return <span className="text-sm">{new Date(analyzedAt).toLocaleString()}</span>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const trace = row.original;
      return (
        <Link href={`/dashboard/traces/${trace.trace_id}`}>
          <Button variant="ghost" size="sm">
            View
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      );
    },
  },
];


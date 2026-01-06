/**
 * OTEL Attributes Panel
 * Groups and displays OpenTelemetry attributes in an organized way
 */

import type { TraceSpan } from "@evilmartians/agent-prism-types";
import type { ReactElement } from "react";
import { DollarSign, TrendingUp } from "lucide-react";
import type { OtelAttributeGroup } from "@/types/trace";

interface OtelAttributesPanelProps {
  data: TraceSpan;
}

interface GroupedAttributes {
  group: OtelAttributeGroup;
  label: string;
  attributes: TraceSpan["attributes"];
  icon?: ReactElement;
}

/**
 * Group OTEL attributes by namespace
 */
function groupOtelAttributes(
  attributes: TraceSpan["attributes"]
): GroupedAttributes[] {
  const groups: Record<OtelAttributeGroup, typeof attributes> = {
    operation: [],
    provider: [],
    usage: [],
    request: [],
    response: [],
    server: [],
    error: [],
    tool: [],
    retrieval: [],
    embedding: [],
    vector_db: [],
    cache: [],
    agent: [],
    other: [],
  };

  attributes.forEach((attr) => {
    const key = attr.key.toLowerCase();
    
    if (key.startsWith("gen_ai.operation.")) {
      groups.operation.push(attr);
    } else if (key.startsWith("gen_ai.provider.")) {
      groups.provider.push(attr);
    } else if (key.startsWith("gen_ai.usage.") || key.includes("cost")) {
      groups.usage.push(attr);
    } else if (key.startsWith("gen_ai.request.")) {
      groups.request.push(attr);
    } else if (key.startsWith("gen_ai.response.")) {
      groups.response.push(attr);
    } else if (key.startsWith("server.")) {
      groups.server.push(attr);
    } else if (key.startsWith("error.")) {
      groups.error.push(attr);
    } else if (key.startsWith("gen_ai.tool.") || key.startsWith("tool.")) {
      groups.tool.push(attr);
    } else if (key.startsWith("retrieval.")) {
      groups.retrieval.push(attr);
    } else if (key.startsWith("gen_ai.embeddings.") || key.startsWith("embedding.")) {
      groups.embedding.push(attr);
    } else if (key.startsWith("vector_db.")) {
      groups.vector_db.push(attr);
    } else if (key.startsWith("cache.")) {
      groups.cache.push(attr);
    } else if (key.startsWith("agent.")) {
      groups.agent.push(attr);
    } else {
      groups.other.push(attr);
    }
  });

  const groupLabels: Record<OtelAttributeGroup, string> = {
    operation: "Operation",
    provider: "Provider",
    usage: "Usage & Cost",
    request: "Request Parameters",
    response: "Response",
    server: "Server",
    error: "Error",
    tool: "Tool",
    retrieval: "Retrieval",
    embedding: "Embedding",
    vector_db: "Vector DB",
    cache: "Cache",
    agent: "Agent",
    other: "Other",
  };

  return Object.entries(groups)
    .filter(([_, attrs]) => attrs.length > 0)
    .map(([group, attrs]) => ({
      group: group as OtelAttributeGroup,
      label: groupLabels[group as OtelAttributeGroup],
      attributes: attrs,
    }));
}

/**
 * Extract cost attributes for highlighting
 */
function extractCostAttributes(
  attributes: TraceSpan["attributes"]
): {
  input_cost?: number;
  output_cost?: number;
  total_cost?: number;
  cost?: number;
} {
  const costAttrs: any = {};
  
  attributes.forEach((attr) => {
    const key = attr.key.toLowerCase();
    const value = attr.value.doubleValue ?? attr.value.intValue;
    
    if (key.includes("input_cost")) {
      costAttrs.input_cost = value;
    } else if (key.includes("output_cost")) {
      costAttrs.output_cost = value;
    } else if (key.includes("total_cost")) {
      costAttrs.total_cost = value;
    } else if (key === "gen_ai.usage.cost" || key === "cost") {
      costAttrs.cost = value;
    }
  });
  
  return costAttrs;
}

/**
 * Format cost value for display
 */
function formatCost(value: number | undefined): string {
  if (value === undefined || value === null) return "N/A";
  if (value < 0.001) {
    return `$${(value * 1000).toFixed(3)}m`; // millicents
  } else if (value < 1) {
    return `$${value.toFixed(4)}`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

export const DetailsViewOtelAttributesPanel = ({
  data,
}: OtelAttributesPanelProps): ReactElement => {
  if (!data.attributes || data.attributes.length === 0) {
    return <></>;
  }

  const grouped = groupOtelAttributes(data.attributes);
  const costAttrs = extractCostAttributes(data.attributes);
  const hasCost = Object.keys(costAttrs).length > 0;

  // Check if we have OTEL attributes (gen_ai.*, server.*, error.*)
  const hasOtelAttrs = data.attributes.some(
    (attr) =>
      attr.key.startsWith("gen_ai.") ||
      attr.key.startsWith("server.") ||
      attr.key.startsWith("error.")
  );

  if (!hasOtelAttrs) {
    return <></>; // Don't show panel if no OTEL attributes
  }

  return (
    <div className="space-y-6">
      {/* Cost Highlight Section */}
      {hasCost && (
        <div className="border-l-4 border-green-500 bg-green-50/50 dark:bg-green-950/20 rounded-md p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="size-4 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              Cost Breakdown
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {costAttrs.input_cost !== undefined && (
              <div>
                <span className="text-muted-foreground">Input Cost:</span>
                <span className="ml-2 font-medium text-green-700 dark:text-green-300">
                  {formatCost(costAttrs.input_cost)}
                </span>
              </div>
            )}
            {costAttrs.output_cost !== undefined && (
              <div>
                <span className="text-muted-foreground">Output Cost:</span>
                <span className="ml-2 font-medium text-green-700 dark:text-green-300">
                  {formatCost(costAttrs.output_cost)}
                </span>
              </div>
            )}
            {(costAttrs.total_cost !== undefined || costAttrs.cost !== undefined) && (
              <div className="col-span-2 pt-2 border-t border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-green-600 dark:text-green-400" />
                  <span className="text-muted-foreground">Total Cost:</span>
                  <span className="ml-2 font-bold text-lg text-green-700 dark:text-green-300">
                    {formatCost(costAttrs.total_cost ?? costAttrs.cost)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grouped OTEL Attributes */}
      {grouped.map((group) => (
        <div key={group.group} className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground capitalize flex items-center gap-2">
            {group.icon}
            {group.label}
            <span className="text-xs text-muted-foreground font-normal">
              ({group.attributes.length})
            </span>
          </h4>
          <div className="space-y-2 pl-4 border-l-2 border-muted">
            {group.attributes.map((attr, index) => {
              const stringValue = attr.value.stringValue;
              const simpleValue =
                stringValue ||
                attr.value.intValue?.toString() ||
                attr.value.doubleValue?.toString() ||
                attr.value.boolValue?.toString() ||
                "N/A";

              return (
                <div
                  key={`${attr.key}-${index}`}
                  className="flex items-start justify-between gap-4 py-1"
                >
                  <dt className="text-xs text-muted-foreground font-mono flex-shrink-0">
                    {attr.key}
                  </dt>
                  <dd className="text-sm text-foreground break-words text-right">
                    {simpleValue}
                  </dd>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};


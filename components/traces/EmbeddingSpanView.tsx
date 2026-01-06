/**
 * Embedding Span Visualization Component
 * Displays embedding-specific information in a user-friendly way
 */

import type { TraceSpan } from "@evilmartians/agent-prism-types";
import type { ReactElement } from "react";
import { Layers, Hash, TrendingUp, Clock } from "lucide-react";

interface EmbeddingSpanViewProps {
  span: TraceSpan;
}

/**
 * Extract embedding-specific attributes from span
 */
function extractEmbeddingData(span: TraceSpan) {
  const attrs = span.attributes || [];
  const data: {
    model?: string;
    dimension_count?: number;
    encoding_formats?: string[];
    input_tokens?: number;
    output_tokens?: number;
    latency_ms?: number;
    cost?: number;
    embeddings_count?: number;
    embeddings_preview?: string[];
  } = {};

  attrs.forEach((attr) => {
    const key = attr.key.toLowerCase();
    const value = attr.value as any;

    if (key === "gen_ai.request.model" || key === "embedding.model") {
      data.model = value?.stringValue ?? undefined;
    } else if (key === "gen_ai.embeddings.dimension.count" || key === "embedding.dimension_count") {
      data.dimension_count = value?.intValue ?? undefined;
    } else if (key === "gen_ai.request.encoding_formats") {
      try {
        const parsed = JSON.parse(value?.stringValue ?? "[]");
        data.encoding_formats = Array.isArray(parsed) ? parsed : undefined;
      } catch {
        // Ignore parse errors
      }
    } else if (key === "gen_ai.usage.input_tokens" || key === "embedding.input_tokens") {
      data.input_tokens = value?.intValue ?? undefined;
    } else if (key === "gen_ai.usage.output_tokens" || key === "embedding.output_tokens") {
      data.output_tokens = value?.intValue ?? undefined;
    } else if (key === "gen_ai.usage.cost" || key === "embedding.cost") {
      data.cost = value?.doubleValue ?? value?.intValue ?? undefined;
    } else if (key === "embedding.latency_ms") {
      data.latency_ms = value?.intValue ?? undefined;
    }
  });

  // Try to extract from output if available
  if (span.output && typeof span.output === "string") {
    try {
      const output = JSON.parse(span.output);
      if (output.embeddings_count) data.embeddings_count = output.embeddings_count;
      if (output.embeddings_preview) data.embeddings_preview = output.embeddings_preview;
    } catch {
      // Ignore parse errors
    }
  }

  return data;
}

/**
 * Format cost for display
 */
function formatCost(value: number | undefined): string {
  if (value === undefined || value === null) return "N/A";
  if (value < 0.001) {
    return `$${(value * 1000).toFixed(3)}m`;
  } else if (value < 1) {
    return `$${value.toFixed(4)}`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

export const EmbeddingSpanView = ({
  span,
}: EmbeddingSpanViewProps): ReactElement | null => {
  // Only show for embedding spans
  if (span.type !== "embedding") {
    return null;
  }

  const data = extractEmbeddingData(span);

  if (!data.model && !data.dimension_count) {
    return null; // Not enough data to display
  }

  return (
    <div className="border-l-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-md p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="size-5 text-emerald-600 dark:text-emerald-400" />
        <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
          Embedding Details
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {data.model && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Model</div>
            <div className="font-medium text-foreground">{data.model}</div>
          </div>
        )}

        {data.dimension_count !== undefined && (
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Hash className="size-3" />
              Dimensions
            </div>
            <div className="font-medium text-foreground">
              {data.dimension_count.toLocaleString()}
            </div>
          </div>
        )}

        {data.embeddings_count !== undefined && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Embeddings</div>
            <div className="font-medium text-foreground">
              {data.embeddings_count.toLocaleString()}
            </div>
          </div>
        )}

        {data.input_tokens !== undefined && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Input Tokens</div>
            <div className="font-medium text-foreground">
              {data.input_tokens.toLocaleString()}
            </div>
          </div>
        )}

        {data.output_tokens !== undefined && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Output Tokens</div>
            <div className="font-medium text-foreground">
              {data.output_tokens.toLocaleString()}
            </div>
          </div>
        )}

        {data.latency_ms !== undefined && (
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Clock className="size-3" />
              Latency
            </div>
            <div className="font-medium text-foreground">
              {data.latency_ms}ms
            </div>
          </div>
        )}

        {data.cost !== undefined && (
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="size-3" />
              Cost
            </div>
            <div className="font-medium text-emerald-700 dark:text-emerald-300">
              {formatCost(data.cost)}
            </div>
          </div>
        )}

        {data.encoding_formats && data.encoding_formats.length > 0 && (
          <div className="col-span-2">
            <div className="text-xs text-muted-foreground mb-1">Encoding Formats</div>
            <div className="flex flex-wrap gap-1">
              {data.encoding_formats.map((format, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-md bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {data.embeddings_preview && data.embeddings_preview.length > 0 && (
        <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800">
          <div className="text-xs text-muted-foreground mb-2">Embeddings Preview</div>
          <div className="space-y-1">
            {data.embeddings_preview.slice(0, 3).map((preview, idx) => (
              <div
                key={idx}
                className="font-mono text-xs text-foreground bg-emerald-100/50 dark:bg-emerald-900/20 p-2 rounded"
              >
                {preview}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


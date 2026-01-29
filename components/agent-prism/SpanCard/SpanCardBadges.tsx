import type { TraceSpan } from "@evilmartians/agent-prism-types";

import { PriceBadge } from "../PriceBadge";
import { SpanBadge } from "../SpanBadge";
import { TokensBadge } from "../TokensBadge";
import { Badge } from "../Badge";

interface SpanCardBagdesProps {
  data: TraceSpan & {
    errorInfo?: {
      type: string;
      message: string;
      fullMessage: string;
      stackTrace?: string;
      context?: Record<string, any>;
      timestamp?: string;
    };
    errorCount?: number;
    /** TRACE_TREE_VIEW_SPEC: per-span signals from API (e.g. tool_error, medium_latency) */
    signals?: Array<{
      signal_type?: string;
      signal_name?: string;
      message?: string;
      severity?: string;
    }>;
  };
}

export const SpanCardBadges = ({ data }: SpanCardBagdesProps) => {
  const errorInfo = (data as any).errorInfo;
  const errorCount = (data as any).errorCount;
  const signals = (data as any).signals as
    | Array<{ signal_type?: string; signal_name?: string }>
    | undefined;
  const attributes = (data as any).attributes as
    | Array<{ key: string }>
    | undefined;

  const extraLabels: string[] = [];
  if (Array.isArray(attributes)) {
    const hasVectorDb = attributes.some((attr) =>
      attr.key.startsWith("vector_db."),
    );
    const hasCache = attributes.some((attr) => attr.key.startsWith("cache."));
    const hasAgent = attributes.some((attr) => attr.key.startsWith("agent."));

    if (hasVectorDb) extraLabels.push("Vector DB");
    if (hasCache) extraLabels.push("Cache");
    if (hasAgent) extraLabels.push("Agent");
  }

  const shouldShowExtraBadges =
    extraLabels.length > 0 &&
    (data.type === "unknown" || data.type === "span" || data.type === "event");

  return (
    <div className="flex flex-wrap items-center justify-start gap-1">
      <SpanBadge category={data.type} title={data.title} />

      {typeof data.tokensCount === "number" && (
        <TokensBadge tokensCount={data.tokensCount} />
      )}

      {typeof data.cost === "number" && <PriceBadge cost={data.cost} />}

      {errorInfo && (
        <Badge size="4" label="Error" className="bg-red-600 text-white" />
      )}

      {errorCount && errorCount > 0 && !errorInfo && (
        <Badge
          size="4"
          label={`${errorCount} Error${errorCount !== 1 ? "s" : ""}`}
          className="bg-red-600 text-white"
        />
      )}

      {signals?.length
        ? signals
            .slice(0, 2)
            .map((sig, i) => (
              <Badge
                key={i}
                size="4"
                label={sig.signal_name || sig.signal_type || "signal"}
                className={
                  (sig.signal_type || sig.signal_name) === "tool_error"
                    ? "bg-red-600 text-white"
                    : "bg-amber-500/90 text-white"
                }
              />
            ))
        : null}

      {shouldShowExtraBadges &&
        extraLabels.map((label) => (
          <Badge
            key={label}
            size="4"
            label={label}
            className="bg-agentprism-muted text-agentprism-muted-foreground"
          />
        ))}
    </div>
  );
};

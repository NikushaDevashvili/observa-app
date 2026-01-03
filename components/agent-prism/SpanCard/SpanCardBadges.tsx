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
  };
}

export const SpanCardBadges = ({ data }: SpanCardBagdesProps) => {
  const errorInfo = (data as any).errorInfo;
  const errorCount = (data as any).errorCount;

  return (
    <div className="flex flex-wrap items-center justify-start gap-1">
      <SpanBadge category={data.type} />

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
    </div>
  );
};

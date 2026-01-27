import type { ReactElement } from "react";

import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "../Badge";
import { Button } from "../Button";

// Format error type outside component to avoid recreating function on every render
const formatErrorType = (type: string): string => {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export interface ErrorSummary {
  totalErrors: number;
  errorTypes: Record<string, number>;
  errorSpans: string[];
  hasErrors: boolean;
}

interface ErrorSummaryBannerProps {
  errorSummary: ErrorSummary;
  onJumpToError?: (spanId: string) => void;
}

export const ErrorSummaryBanner = ({
  errorSummary,
  onJumpToError,
}: ErrorSummaryBannerProps): ReactElement => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!errorSummary.hasErrors) {
    return <></>;
  }

  const errorTypesList = useMemo(
    () =>
      Object.entries(errorSummary.errorTypes)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
    [errorSummary.errorTypes]
  );

  return (
    <div className="border-agentprism-error/20 bg-agentprism-error-muted/50 border-l-4 rounded-md p-3 mb-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <AlertTriangle className="size-4 text-agentprism-error shrink-0" />
          <Badge
            size="5"
            label={`${errorSummary.totalErrors} Error${errorSummary.totalErrors !== 1 ? "s" : ""}`}
            className="bg-agentprism-error text-agentprism-error-foreground shrink-0"
          />
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {errorTypesList.slice(0, 3).map(({ type, count }) => (
              <span
                key={type}
                className="text-agentprism-foreground text-sm whitespace-nowrap"
              >
                {count} {formatErrorType(type)}
                {count > 1 ? "s" : ""}
              </span>
            ))}
            {errorTypesList.length > 3 && (
              <span className="text-agentprism-muted-foreground text-sm">
                +{errorTypesList.length - 3} more
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {errorSummary.errorSpans.length > 0 && onJumpToError && (
            <Button
              size="7"
              variant="outlined"
              onClick={() => onJumpToError(errorSummary.errorSpans[0])}
            >
              Jump to First Error
            </Button>
          )}
          <Button
            size="7"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {isExpanded && errorSummary.errorSpans.length > 0 && (
        <div className="mt-3 pt-3 border-t border-agentprism-border">
          <div className="text-agentprism-foreground text-sm font-medium mb-2">
            Error Spans ({errorSummary.errorSpans.length}):
          </div>
          <div className="flex flex-wrap gap-2">
            {errorSummary.errorSpans.map((spanId) => (
              <Button
                key={spanId}
                size="7"
                variant="outlined"
                onClick={() => onJumpToError?.(spanId)}
                className="text-xs"
              >
                {spanId.substring(0, 8)}...
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


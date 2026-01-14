import type { TraceSpan } from "@evilmartians/agent-prism-types";
import type { ReactElement } from "react";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

import { Badge } from "../Badge";
import { Button } from "../Button";
import { CollapsibleSection } from "../CollapsibleSection";
import {
  DetailsViewContentViewer,
  type DetailsViewContentViewMode,
} from "./DetailsViewContentViewer";

interface ErrorInfo {
  type: string;
  message: string;
  fullMessage: string;
  stackTrace?: string;
  context?: Record<string, any>;
  timestamp?: string;
  errorCode?: string;
  classification?: {
    category?: string;
    severity?: string;
    impact?: string;
  };
}

interface DetailsViewErrorTabProps {
  data: TraceSpan & {
    errorInfo?: ErrorInfo;
  };
}

const formatErrorType = (type: string): string => {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const DetailsViewErrorTab = ({
  data,
}: DetailsViewErrorTabProps): ReactElement => {
  const errorInfo = (data as any).errorInfo as ErrorInfo | undefined;
  const [copied, setCopied] = useState(false);

  if (!errorInfo) {
    return (
      <div className="border-agentprism-border rounded-md border p-4">
        <p className="text-agentprism-muted-foreground text-sm">
          No error information available for this span
        </p>
      </div>
    );
  }

  const handleCopyError = async () => {
    const errorText = `Error Type: ${errorInfo.type}\nMessage: ${errorInfo.fullMessage}${
      errorInfo.stackTrace ? `\n\nStack Trace:\n${errorInfo.stackTrace}` : ""
    }${errorInfo.context ? `\n\nContext:\n${JSON.stringify(errorInfo.context, null, 2)}` : ""}`;

    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy error details:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Error Type Badge */}
      <div className="border-agentprism-border rounded-md border p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-agentprism-error" />
            <span className="text-agentprism-foreground font-medium">
              Error Type
            </span>
          </div>
          <Badge
            size="5"
            label={formatErrorType(errorInfo.type)}
            className="bg-agentprism-error text-agentprism-error-foreground"
          />
        </div>
      </div>

      {/* Error Category and Code */}
      {errorInfo.classification && (
        <div className="border-agentprism-border rounded-md border p-4">
          <div className="space-y-2">
            {errorInfo.classification.category && (
              <div className="flex items-center justify-between">
                <span className="text-agentprism-muted-foreground text-sm font-medium">
                  Error Category:
                </span>
                <Badge
                  size="5"
                  label={formatErrorType(errorInfo.classification.category)}
                  className="bg-agentprism-muted text-agentprism-muted-foreground"
                />
              </div>
            )}
            {errorInfo.errorCode && (
              <div className="flex items-center justify-between">
                <span className="text-agentprism-muted-foreground text-sm font-medium">
                  Error Code:
                </span>
                <code className="text-agentprism-foreground text-sm font-mono bg-agentprism-muted px-2 py-1 rounded">
                  {errorInfo.errorCode}
                </code>
              </div>
            )}
            {errorInfo.classification.severity && (
              <div className="flex items-center justify-between">
                <span className="text-agentprism-muted-foreground text-sm font-medium">
                  Severity:
                </span>
                <Badge
                  size="5"
                  label={errorInfo.classification.severity.toUpperCase()}
                  className={
                    errorInfo.classification.severity === "critical"
                      ? "bg-red-500 text-white"
                      : errorInfo.classification.severity === "high"
                      ? "bg-orange-500 text-white"
                      : errorInfo.classification.severity === "medium"
                      ? "bg-yellow-500 text-black"
                      : "bg-gray-500 text-white"
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      <div className="border-agentprism-border rounded-md border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-agentprism-foreground font-medium">
            Error Message
          </span>
          <Button
            size="7"
            variant="ghost"
            onClick={handleCopyError}
            iconStart={copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <div className="bg-agentprism-muted rounded-md p-3">
          <p className="text-agentprism-foreground text-sm whitespace-pre-wrap break-words">
            {errorInfo.fullMessage}
          </p>
        </div>
      </div>

      {/* Stack Trace */}
      {errorInfo.stackTrace && (
        <CollapsibleSection
          title="Stack Trace"
          defaultOpen={false}
          rightContent={
            <Badge
              size="4"
              label={`${errorInfo.stackTrace.split("\n").length} lines`}
              className="bg-agentprism-muted text-agentprism-muted-foreground"
            />
          }
        >
          <div className="bg-agentprism-muted rounded-md p-3 overflow-hidden">
            <pre className="text-agentprism-foreground text-xs font-mono whitespace-pre-wrap break-words max-w-full overflow-x-auto">
              {errorInfo.stackTrace}
            </pre>
          </div>
        </CollapsibleSection>
      )}

      {/* Error Context */}
      {errorInfo.context && Object.keys(errorInfo.context).length > 0 && (
        <CollapsibleSection
          title="Error Context"
          defaultOpen={false}
        >
          <div className="bg-agentprism-muted rounded-md p-3 overflow-hidden">
            <pre className="text-agentprism-foreground text-xs font-mono whitespace-pre-wrap break-words max-w-full overflow-x-auto">
              {JSON.stringify(errorInfo.context, null, 2)}
            </pre>
          </div>
        </CollapsibleSection>
      )}

      {/* Timestamp */}
      {errorInfo.timestamp && (
        <div className="border-agentprism-border rounded-md border p-4">
          <span className="text-agentprism-muted-foreground text-sm font-medium">
            Occurred At:
          </span>
          <p className="text-agentprism-foreground text-sm mt-1">
            {new Date(errorInfo.timestamp).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};


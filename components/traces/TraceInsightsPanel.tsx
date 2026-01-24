import Link from "next/link";
import type { ReactElement } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/agent-prism/CopyButton";
import { CollapsibleSection } from "@/components/agent-prism/CollapsibleSection";
import { DetailsViewJsonOutput } from "@/components/agent-prism/DetailsView/DetailsViewJsonOutput";
import type {
  TraceConversationContext,
  TraceTree,
} from "@/types/trace";

interface TraceInsightsPanelProps {
  trace: TraceTree;
  conversation?: TraceConversationContext | null;
}

const formatNumber = (value?: number | null, digits = 2): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "n/a";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "n/a";
  if (typeof value === "number") return formatNumber(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "n/a";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const renderKeyValueGrid = (items: Array<{ label: string; value: unknown }>) => (
  <dl className="grid gap-3 sm:grid-cols-2">
    {items.map((item) => (
      <div key={item.label} className="space-y-1">
        <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
        <dd className="text-sm break-words">{formatValue(item.value)}</dd>
      </div>
    ))}
  </dl>
);

const renderConversation = (
  conversation?: TraceConversationContext | null
): ReactElement => {
  if (!conversation) {
    return <p className="text-sm text-muted-foreground">No conversation data.</p>;
  }

  return (
    <div className="space-y-3">
      {renderKeyValueGrid([
        { label: "Conversation ID", value: conversation.id },
        { label: "Message Index", value: conversation.messageIndex },
        { label: "Total Messages", value: conversation.totalMessages },
      ])}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {conversation.previousTraceId ? (
          <Link
            className="text-primary underline underline-offset-4"
            href={`/dashboard/traces/${conversation.previousTraceId}`}
          >
            Previous Trace
          </Link>
        ) : (
          <span className="text-muted-foreground">Previous Trace: n/a</span>
        )}
        {conversation.nextTraceId ? (
          <Link
            className="text-primary underline underline-offset-4"
            href={`/dashboard/traces/${conversation.nextTraceId}`}
          >
            Next Trace
          </Link>
        ) : (
          <span className="text-muted-foreground">Next Trace: n/a</span>
        )}
      </div>
      {conversation.conversationMetrics && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Conversation Metrics
          </div>
          {renderKeyValueGrid([
            {
              label: "Total Tokens",
              value: conversation.conversationMetrics.totalTokens,
            },
            {
              label: "Average Latency (ms)",
              value: conversation.conversationMetrics.avgLatencyMs,
            },
            {
              label: "Total Cost (USD)",
              value: conversation.conversationMetrics.totalCostUsd,
            },
            {
              label: "Issue Count",
              value: conversation.conversationMetrics.issueCount,
            },
          ])}
        </div>
      )}
    </div>
  );
};

export const TraceInsightsPanel = ({
  trace,
  conversation,
}: TraceInsightsPanelProps): ReactElement => {
  const rawTrace = JSON.stringify({ trace, conversation }, null, 2);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Analysis</CardTitle>
          <CopyButton label="Analysis" content={JSON.stringify(trace.analysis || {}, null, 2)} />
        </CardHeader>
        <CardContent className="space-y-4">
          {trace.analysis
            ? renderKeyValueGrid(
                Object.entries(trace.analysis).map(([label, value]) => ({
                  label,
                  value,
                }))
              )
            : (
              <p className="text-sm text-muted-foreground">No analysis data available.</p>
            )}
          <CollapsibleSection title="Analysis JSON" defaultOpen={false}>
            <DetailsViewJsonOutput content={JSON.stringify(trace.analysis || {}, null, 2)} id="trace-analysis" />
          </CollapsibleSection>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Conversation</CardTitle>
          <CopyButton
            label="Conversation"
            content={JSON.stringify(conversation || {}, null, 2)}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {renderConversation(conversation)}
          <CollapsibleSection title="Conversation JSON" defaultOpen={false}>
            <DetailsViewJsonOutput
              content={JSON.stringify(conversation || {}, null, 2)}
              id="trace-conversation"
            />
          </CollapsibleSection>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Trace Metadata</CardTitle>
          <CopyButton label="Trace Metadata" content={JSON.stringify(trace._meta || {}, null, 2)} />
        </CardHeader>
        <CardContent className="space-y-4">
          {trace._meta
            ? renderKeyValueGrid(
                Object.entries(trace._meta).map(([label, value]) => ({
                  label,
                  value,
                }))
              )
            : (
              <p className="text-sm text-muted-foreground">No metadata available.</p>
            )}
          <CollapsibleSection title="Metadata JSON" defaultOpen={false}>
            <DetailsViewJsonOutput content={JSON.stringify(trace._meta || {}, null, 2)} id="trace-meta" />
          </CollapsibleSection>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Full Trace JSON</CardTitle>
          <CopyButton label="Full Trace" content={rawTrace} />
        </CardHeader>
        <CardContent>
          <DetailsViewJsonOutput content={rawTrace} id="trace-full-json" />
        </CardContent>
      </Card>
    </div>
  );
};

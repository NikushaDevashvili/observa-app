import Link from "next/link";
import type { ReactElement } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/agent-prism/CopyButton";
import { CollapsibleSection } from "@/components/agent-prism/CollapsibleSection";
import { DetailsViewJsonOutput } from "@/components/agent-prism/DetailsView/DetailsViewJsonOutput";
import type {
  TraceConversationContext,
  TraceCostBreakdown,
  TracePerformanceAnalysis,
  TraceQualityExplanation,
  TraceSignal,
  TraceTokenEfficiency,
  TraceTree,
} from "@/types/trace";

interface TraceInsightsPanelProps {
  trace: TraceTree;
  conversation?: TraceConversationContext | null;
}

const formatDateTime = (value?: string | null): string => {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

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

const renderSignals = (signals: TraceSignal[]) => {
  if (!signals.length) {
    return <p className="text-sm text-muted-foreground">No signals detected.</p>;
  }

  const severityVariant = (severity?: string) => {
    if (severity === "high") return "destructive";
    if (severity === "medium") return "secondary";
    if (severity === "low") return "outline";
    return "default";
  };

  return (
    <div className="space-y-3">
      {signals.map((signal, index) => (
        <div
          key={`${signal.signal_type || "signal"}-${index}`}
          className="rounded-md border bg-muted/40 p-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={severityVariant(signal.severity)}>
              {signal.signal_type || "signal"}
            </Badge>
            {signal.severity && (
              <span className="text-xs text-muted-foreground">
                Severity: {signal.severity}
              </span>
            )}
            {typeof signal.confidence === "number" && (
              <span className="text-xs text-muted-foreground">
                Confidence: {formatNumber(signal.confidence, 3)}
              </span>
            )}
            {typeof signal.score === "number" && (
              <span className="text-xs text-muted-foreground">
                Score: {formatNumber(signal.score, 3)}
              </span>
            )}
          </div>
          {signal.reasoning && (
            <p className="mt-2 text-sm text-muted-foreground">{signal.reasoning}</p>
          )}
        </div>
      ))}
    </div>
  );
};

const renderCostBreakdown = (costBreakdown?: TraceCostBreakdown | null) => {
  if (!costBreakdown) {
    return <p className="text-sm text-muted-foreground">No cost data available.</p>;
  }

  const byTypeEntries = Object.entries(costBreakdown.byType || {});
  const topSpans = costBreakdown.topSpans || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Total:</span>
        <Badge variant="outline">${formatNumber(costBreakdown.totalCostUsd, 6)}</Badge>
      </div>
      {byTypeEntries.length > 0 && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">
            By Type
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {byTypeEntries.map(([type, value]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{type}</span>
                <span>${formatNumber(value, 6)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {topSpans.length > 0 && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Top Spans
          </div>
          <div className="space-y-2">
            {topSpans.map((span) => (
              <div
                key={span.spanId}
                className="flex flex-col rounded-md border bg-muted/40 p-2 text-sm"
              >
                <span className="font-medium">{span.name}</span>
                <span className="text-xs text-muted-foreground">
                  {span.spanId}
                </span>
                <span className="text-xs text-muted-foreground">
                  ${formatNumber(span.costUsd, 6)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const renderPerformance = (performance?: TracePerformanceAnalysis | null) => {
  if (!performance) {
    return <p className="text-sm text-muted-foreground">No performance data.</p>;
  }

  return (
    <div className="space-y-3">
      {renderKeyValueGrid([
        { label: "Bottleneck Span ID", value: performance.bottleneckSpanId },
        {
          label: "Bottleneck Duration (ms)",
          value: performance.bottleneckDurationMs,
        },
        {
          label: "Bottleneck Percentage",
          value:
            typeof performance.bottleneckPercentage === "number"
              ? `${formatNumber(performance.bottleneckPercentage, 2)}%`
              : performance.bottleneckPercentage,
        },
      ])}
      {performance.suggestions && performance.suggestions.length > 0 && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Suggestions
          </div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {performance.suggestions.map((suggestion, index) => (
              <li key={`${suggestion}-${index}`}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const renderTokenEfficiency = (tokenEfficiency?: TraceTokenEfficiency | null) => {
  if (!tokenEfficiency) {
    return <p className="text-sm text-muted-foreground">No token data.</p>;
  }

  return renderKeyValueGrid([
    {
      label: "Tokens per Character",
      value: tokenEfficiency.tokensPerCharacter,
    },
    { label: "Input Efficiency", value: tokenEfficiency.inputEfficiency },
    { label: "Output Efficiency", value: tokenEfficiency.outputEfficiency },
    {
      label: "Benchmark",
      value: tokenEfficiency.benchmarkComparison,
    },
  ]);
};

const renderQualityExplanation = (
  qualityExplanation?: TraceQualityExplanation | null
) => {
  if (!qualityExplanation) {
    return <p className="text-sm text-muted-foreground">No quality data.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Overall Score:</span>
        <Badge variant="outline">
          {formatValue(qualityExplanation.overallScore)}
        </Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(qualityExplanation.breakdown || {}).map(
          ([key, detail]) => (
            <div key={key} className="rounded-md border bg-muted/40 p-3">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                {key}
              </div>
              <div className="text-sm">{formatValue(detail?.score)}</div>
              <div className="text-xs text-muted-foreground">
                {detail?.explanation}
              </div>
            </div>
          )
        )}
      </div>
      {qualityExplanation.improvements && qualityExplanation.improvements.length > 0 && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Improvements
          </div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {qualityExplanation.improvements.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

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
          <CardTitle className="text-base">Signals</CardTitle>
          <CopyButton label="Signals" content={JSON.stringify(trace.signals || [], null, 2)} />
        </CardHeader>
        <CardContent className="space-y-4">
          {renderSignals(trace.signals || [])}
          <CollapsibleSection title="Signals JSON" defaultOpen={false}>
            <DetailsViewJsonOutput content={JSON.stringify(trace.signals || [], null, 2)} id="trace-signals" />
          </CollapsibleSection>
        </CardContent>
      </Card>

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
          <CardTitle className="text-base">Cost Breakdown</CardTitle>
          <CopyButton
            label="Cost Breakdown"
            content={JSON.stringify(trace.costBreakdown || {}, null, 2)}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {renderCostBreakdown(trace.costBreakdown)}
          <CollapsibleSection title="Cost JSON" defaultOpen={false}>
            <DetailsViewJsonOutput
              content={JSON.stringify(trace.costBreakdown || {}, null, 2)}
              id="trace-cost"
            />
          </CollapsibleSection>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Performance</CardTitle>
          <CopyButton
            label="Performance"
            content={JSON.stringify(trace.performanceAnalysis || {}, null, 2)}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {renderPerformance(trace.performanceAnalysis)}
          <CollapsibleSection title="Performance JSON" defaultOpen={false}>
            <DetailsViewJsonOutput
              content={JSON.stringify(trace.performanceAnalysis || {}, null, 2)}
              id="trace-performance"
            />
          </CollapsibleSection>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Token Efficiency</CardTitle>
          <CopyButton
            label="Token Efficiency"
            content={JSON.stringify(trace.tokenEfficiency || {}, null, 2)}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {renderTokenEfficiency(trace.tokenEfficiency)}
          <CollapsibleSection title="Token JSON" defaultOpen={false}>
            <DetailsViewJsonOutput
              content={JSON.stringify(trace.tokenEfficiency || {}, null, 2)}
              id="trace-tokens"
            />
          </CollapsibleSection>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Quality Explanation</CardTitle>
          <CopyButton
            label="Quality Explanation"
            content={JSON.stringify(trace.qualityExplanation || {}, null, 2)}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {renderQualityExplanation(trace.qualityExplanation)}
          <CollapsibleSection title="Quality JSON" defaultOpen={false}>
            <DetailsViewJsonOutput
              content={JSON.stringify(trace.qualityExplanation || {}, null, 2)}
              id="trace-quality"
            />
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

import type { TraceSpan } from "@evilmartians/agent-prism-types";
import type { ReactElement } from "react";

import { useState, useEffect } from "react";

import { deriveErrorInfoFromSpan, isErrorSpan } from "@/lib/spanError";
import type { TabItem } from "../Tabs";

import { CollapsibleSection } from "../CollapsibleSection";
import { TabSelector } from "../TabSelector";
import {
  DetailsViewContentViewer,
  type DetailsViewContentViewMode,
} from "./DetailsViewContentViewer";
import { Badge } from "../Badge";

interface DetailsViewInputOutputTabProps {
  data: TraceSpan;
}

type IOSection = "Input" | "Output";

export const DetailsViewInputOutputTab = ({
  data,
}: DetailsViewInputOutputTabProps): ReactElement => {
  // Extract LLM call data from span (multiple possible locations)
  const llmData = (data as any).llm_call || (data as any).details?.llm_call;
  const llmEvent = (data as any).events?.find(
    (e: any) => e.event_type === "llm_call",
  );
  const llmCall = llmData || llmEvent?.attributes?.llm_call;
  const attributes = (data as any).attributes;

  const normalizeAttributeValue = (value: any): any => {
    if (value === null || value === undefined) return null;
    if (typeof value !== "object") return value;
    if ("stringValue" in value) return value.stringValue;
    if ("boolValue" in value) return value.boolValue;
    if ("intValue" in value) return value.intValue;
    if ("doubleValue" in value) return value.doubleValue;
    if ("arrayValue" in value && Array.isArray(value.arrayValue?.values)) {
      return value.arrayValue.values.map((entry: any) =>
        normalizeAttributeValue(entry),
      );
    }
    if ("kvlistValue" in value && Array.isArray(value.kvlistValue?.values)) {
      const mapped: Record<string, any> = {};
      value.kvlistValue.values.forEach((entry: any) => {
        if (entry?.key) {
          mapped[entry.key] = normalizeAttributeValue(entry.value);
        }
      });
      return mapped;
    }
    if ("value" in value) return normalizeAttributeValue(value.value);
    return value;
  };

  const getAttributeValue = (key: string): any => {
    if (!attributes) return null;
    if (Array.isArray(attributes)) {
      const match = attributes.find((attr: any) => attr.key === key);
      return normalizeAttributeValue(match?.value);
    }
    if (typeof attributes === "object" && key in attributes) {
      return normalizeAttributeValue((attributes as Record<string, any>)[key]);
    }
    return null;
  };

  // Extract system instructions from multiple sources
  let systemInstructions =
    (llmCall as any)?.system_instructions ??
    (data as any).system_instructions ??
    getAttributeValue("gen_ai.system_instructions");

  // If not found, try extracting from input_messages
  if (!systemInstructions && llmCall?.input_messages) {
    const systemMessages = (llmCall.input_messages as any[]).filter(
      (msg: any) => msg.role === "system" || msg.role === "System",
    );
    if (systemMessages.length > 0) {
      systemInstructions = systemMessages.map((msg: any) => {
        if (typeof msg.content === "string") return msg.content;
        if (Array.isArray(msg.content)) {
          return msg.content
            .map((c: any) => (typeof c === "string" ? c : c?.text || ""))
            .filter(Boolean)
            .join("\n");
        }
        return msg.text || msg.content || "";
      });
    }
  }
  const availableTools =
    (data as any).available_tools ??
    getAttributeValue("observa.available_tools") ??
    getAttributeValue("llm_call.tool_definitions") ??
    getAttributeValue("gen_ai.request.tools");
  const executedTools =
    (data as any).executed_tools ?? getAttributeValue("observa.executed_tools");
  const attemptedToolCalls =
    (data as any).attempted_tool_calls ??
    getAttributeValue("observa.attempted_tool_calls");

  // Extract input/output from multiple sources
  let inputText: string | null = null;
  let outputText: string | null = null;
  let modelName: string | null = null;

  // Try to get from llm_call data first (most reliable)
  if (llmCall) {
    inputText = llmCall.input || null;
    outputText = llmCall.output || null;
    modelName = llmCall.model || null;
  }

  // Fallback to span-level input/output
  if (!inputText && typeof (data as any).input === "string") {
    inputText = (data as any).input;
  }
  if (!outputText && typeof (data as any).output === "string") {
    outputText = (data as any).output;
  }

  // Extract model name from attributes if not found
  if (!modelName && (data as any).attributes) {
    const attrs = (data as any).attributes;
    if (Array.isArray(attrs)) {
      const modelAttr = attrs.find(
        (a: any) =>
          a.key === "llm_call.model" ||
          a.key === "gen_ai.system.name" ||
          a.key === "gen_ai.request.model",
      );
      if (modelAttr?.value?.stringValue) {
        modelName = modelAttr.value.stringValue;
      }
    }
  }

  const hasInput =
    inputText !== null && inputText !== undefined && inputText !== "";
  const hasOutput =
    outputText !== null && outputText !== undefined && outputText !== "";

  const errorSpan = isErrorSpan(data);
  const derivedError = errorSpan ? deriveErrorInfoFromSpan(data) : null;

  // Parse JSON if possible
  let parsedInput: string | null = null;
  let parsedOutput: string | null = null;

  if (inputText && typeof inputText === "string") {
    try {
      parsedInput = JSON.parse(inputText);
    } catch {
      parsedInput = null;
    }
  }

  if (outputText && typeof outputText === "string") {
    try {
      parsedOutput = JSON.parse(outputText);
    } catch {
      parsedOutput = null;
    }
  }

  // Structured messages (input_messages / output_messages) for Messages view
  const inputMessages = (llmCall as any)?.input_messages ?? null;
  const outputMessages = (llmCall as any)?.output_messages ?? null;
  const hasStructuredMessages =
    (Array.isArray(inputMessages) && inputMessages.length > 0) ||
    (Array.isArray(outputMessages) && outputMessages.length > 0);

  // Tool call details (for tool_call spans or when present in LLM span)
  const toolCallData =
    (data as any).tool_call ??
    (data as any).details?.tool_call ??
    (attributes as any)?.tool_call ??
    null;

  // LLM config (sampling parameters)
  const samplingParams = llmCall
    ? {
        temperature: (llmCall as any).temperature,
        top_p: (llmCall as any).top_p,
        top_k: (llmCall as any).top_k,
        max_tokens: (llmCall as any).max_tokens,
        frequency_penalty: (llmCall as any).frequency_penalty,
        presence_penalty: (llmCall as any).presence_penalty,
        seed: (llmCall as any).seed,
        stop_sequences: (llmCall as any).stop_sequences,
      }
    : null;
  const hasSamplingParams =
    samplingParams &&
    Object.values(samplingParams).some(
      (v) => v !== null && v !== undefined && v !== "",
    );

  // Cost breakdown
  const inputCost = (llmCall as any)?.input_cost ?? null;
  const outputCost = (llmCall as any)?.output_cost ?? null;
  const totalCost = (llmCall as any)?.cost ?? (data as any)?.cost ?? null;
  const hasCostBreakdown =
    typeof inputCost === "number" ||
    typeof outputCost === "number" ||
    typeof totalCost === "number";

  return (
    <div className="space-y-4">
      {/* Model Name Badge */}
      {modelName && modelName !== "unknown" && (
        <div className="border-agentprism-border rounded-md border p-3 bg-agentprism-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-agentprism-muted-foreground text-xs font-medium">
              Model:
            </span>
            <Badge
              size="5"
              label={modelName}
              className="bg-agentprism-background text-agentprism-foreground border border-agentprism-border"
            />
          </div>
        </div>
      )}

      {/* Cost breakdown (input / output / total) */}
      {hasCostBreakdown && (
        <div className="border-agentprism-border rounded-md border p-3 bg-agentprism-muted/30">
          <div className="text-agentprism-muted-foreground mb-2 text-xs font-medium">
            Cost
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {typeof totalCost === "number" && (
              <span>
                Total: <strong>${totalCost.toFixed(4)}</strong>
              </span>
            )}
            {typeof inputCost === "number" && (
              <span className="text-agentprism-muted-foreground">
                Input: ${inputCost.toFixed(4)}
              </span>
            )}
            {typeof outputCost === "number" && (
              <span className="text-agentprism-muted-foreground">
                Output: ${outputCost.toFixed(4)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* LLM Config (sampling parameters) */}
      {hasSamplingParams && (
        <ContextSection title="LLM Config" value={samplingParams} />
      )}

      {/* Structured Messages with role badges */}
      {hasStructuredMessages && (
        <MessagesSection
          inputMessages={inputMessages}
          outputMessages={outputMessages}
        />
      )}

      {/* Tool call detail panel */}
      {toolCallData && <ToolCallDetailPanel data={toolCallData} />}

      <ContextSection title="System Instructions" value={systemInstructions} />
      <ContextSection title="Available Tools" value={availableTools} />
      <ContextSection title="Executed Tools" value={executedTools} />
      <ContextSection title="Attempted Tool Calls" value={attemptedToolCalls} />

      {/* Input Section - Always show, even if empty */}
      <IOSection
        section="Input"
        content={inputText || ""}
        parsedContent={parsedInput}
        isEmpty={!hasInput}
        isErrorSpan={errorSpan}
        derivedErrorMessage={derivedError?.fullMessage}
      />

      {/* Output Section - Show if available */}
      {(hasOutput || outputText === null) && (
        <IOSection
          section="Output"
          content={outputText || derivedError?.fullMessage || ""}
          parsedContent={parsedOutput}
          isEmpty={!hasOutput && !derivedError?.fullMessage}
          isErrorSpan={errorSpan}
          derivedErrorMessage={derivedError?.fullMessage}
        />
      )}
    </div>
  );
};

interface IOSectionProps {
  section: IOSection;
  content: string;
  parsedContent: string | null;
  isEmpty?: boolean;
  isErrorSpan?: boolean;
  derivedErrorMessage?: string | null;
}

const IOSection = ({
  section,
  content,
  parsedContent,
  isEmpty = false,
  isErrorSpan = false,
  derivedErrorMessage,
}: IOSectionProps): ReactElement => {
  const [tab, setTab] = useState<DetailsViewContentViewMode>(
    parsedContent ? "json" : "plain",
  );

  useEffect(() => {
    if (tab === "json" && !parsedContent) {
      setTab("plain");
    }
  }, [tab, parsedContent]);

  const tabItems: TabItem<DetailsViewContentViewMode>[] = [
    { value: "json", label: "JSON", disabled: !parsedContent },
    { value: "plain", label: "Plain" },
  ];

  const emptyMessage = isErrorSpan
    ? "This is an error span. Switch to the Error tab for the message and stack trace."
    : `No ${section.toLowerCase()} data available for this span`;

  return (
    <CollapsibleSection
      title={section}
      defaultOpen
      rightContent={
        <TabSelector<DetailsViewContentViewMode>
          items={tabItems}
          defaultValue={parsedContent ? "json" : "plain"}
          value={tab}
          onValueChange={setTab}
          theme="pill"
          onClick={(event) => event.stopPropagation()}
        />
      }
    >
      {isEmpty ? (
        <div className="border-agentprism-border rounded-md border p-4 bg-agentprism-muted/20">
          <p className="text-agentprism-muted-foreground text-sm italic">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <DetailsViewContentViewer
          content={content}
          parsedContent={parsedContent}
          mode={tab}
          label={section}
          id={section}
        />
      )}
    </CollapsibleSection>
  );
};

interface ContextSectionProps {
  title: string;
  value: any;
}

const isEmptyContent = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

const ContextSection = ({
  title,
  value,
}: ContextSectionProps): ReactElement => {
  const isJsonContent =
    value !== null &&
    value !== undefined &&
    (Array.isArray(value) || typeof value === "object");
  const content =
    typeof value === "string"
      ? value
      : value
        ? JSON.stringify(value, null, 2)
        : "";
  const parsedContent = isJsonContent ? value : null;
  const isEmpty = isEmptyContent(value);
  const sectionId = title.toLowerCase().replace(/\s+/g, "-");
  const [tab, setTab] = useState<DetailsViewContentViewMode>(
    parsedContent ? "json" : "plain",
  );

  useEffect(() => {
    if (tab === "json" && !parsedContent) {
      setTab("plain");
    }
  }, [tab, parsedContent]);

  const tabItems: TabItem<DetailsViewContentViewMode>[] = [
    { value: "json", label: "JSON", disabled: !parsedContent },
    { value: "plain", label: "Plain" },
  ];

  return (
    <CollapsibleSection
      title={title}
      defaultOpen={false}
      rightContent={
        <TabSelector<DetailsViewContentViewMode>
          items={tabItems}
          defaultValue={parsedContent ? "json" : "plain"}
          value={tab}
          onValueChange={setTab}
          theme="pill"
          onClick={(event) => event.stopPropagation()}
        />
      }
    >
      {isEmpty ? (
        <div className="border-agentprism-border rounded-md border p-4 bg-agentprism-muted/20">
          <p className="text-agentprism-muted-foreground text-sm italic">
            No {title.toLowerCase()} available for this span
          </p>
        </div>
      ) : (
        <DetailsViewContentViewer
          content={content}
          parsedContent={parsedContent}
          mode={tab}
          label={title}
          id={sectionId}
        />
      )}
    </CollapsibleSection>
  );
};

/** Role badge color for message roles */
const roleBadgeClass: Record<string, string> = {
  system:
    "bg-agentprism-muted text-agentprism-foreground border-agentprism-border",
  user: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40",
  assistant:
    "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/40",
  tool: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40",
  model:
    "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/40",
};

function messageContent(msg: any): string {
  if (typeof msg?.content === "string") return msg.content;
  if (Array.isArray(msg?.content)) {
    return msg.content
      .map((c: any) => (typeof c === "string" ? c : (c?.text ?? "")))
      .filter(Boolean)
      .join("\n");
  }
  return msg?.text ?? JSON.stringify(msg?.content ?? msg ?? "");
}

interface MessagesSectionProps {
  inputMessages: any[] | null;
  outputMessages: any[] | null;
}

const MessagesSection = ({
  inputMessages,
  outputMessages,
}: MessagesSectionProps): ReactElement => {
  const inputList = Array.isArray(inputMessages) ? inputMessages : [];
  const outputList = Array.isArray(outputMessages) ? outputMessages : [];
  const hasInput = inputList.length > 0;
  const hasOutput = outputList.length > 0;

  const renderMessage = (msg: any, index: number) => {
    const role = (msg?.role ?? "user").toLowerCase();
    const badgeClass =
      roleBadgeClass[role] ||
      "bg-agentprism-muted text-agentprism-foreground border-agentprism-border";
    return (
      <div
        key={index}
        className="border-agentprism-border mb-2 rounded border p-3"
      >
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium border ${badgeClass}`}
          >
            {role}
          </span>
        </div>
        <pre className="text-agentprism-foreground whitespace-pre-wrap break-words font-mono text-xs">
          {messageContent(msg)}
        </pre>
      </div>
    );
  };

  return (
    <CollapsibleSection title="Messages" defaultOpen={true}>
      {hasInput && (
        <div className="mb-4">
          <div className="text-agentprism-muted-foreground mb-2 text-xs font-medium">
            Input messages
          </div>
          {inputList.map(renderMessage)}
        </div>
      )}
      {hasOutput && (
        <div>
          <div className="text-agentprism-muted-foreground mb-2 text-xs font-medium">
            Output messages
          </div>
          {outputList.map(renderMessage)}
        </div>
      )}
    </CollapsibleSection>
  );
};

interface ToolCallDetailPanelProps {
  data: {
    tool_name?: string | null;
    args?: any;
    result?: any;
    result_status?: string | null;
    latency_ms?: number | null;
    error_message?: string | null;
  };
}

const ToolCallDetailPanel = ({
  data,
}: ToolCallDetailPanelProps): ReactElement => {
  const name = data.tool_name ?? "Tool";
  const status = data.result_status ?? "unknown";
  const isError = status === "error" || status === "timeout";
  const argsStr =
    data.args != null
      ? typeof data.args === "string"
        ? data.args
        : JSON.stringify(data.args, null, 2)
      : null;
  const resultStr =
    data.result != null
      ? typeof data.result === "string"
        ? data.result
        : JSON.stringify(data.result, null, 2)
      : null;

  return (
    <CollapsibleSection title="Tool call" defaultOpen={true}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-agentprism-foreground font-medium">{name}</span>
          <Badge
            size="5"
            label={status}
            className={
              isError
                ? "border-red-500/50 bg-red-500/20 text-red-700 dark:text-red-300"
                : "bg-agentprism-background text-agentprism-foreground border border-agentprism-border"
            }
          />
          {typeof data.latency_ms === "number" && (
            <span className="text-agentprism-muted-foreground text-xs">
              {data.latency_ms}ms
            </span>
          )}
        </div>
        {data.error_message && (
          <div className="border-agentprism-border rounded border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-700 dark:text-red-300">
            {data.error_message}
          </div>
        )}
        {argsStr && (
          <div>
            <div className="text-agentprism-muted-foreground mb-1 text-xs font-medium">
              Arguments
            </div>
            <pre className="border-agentprism-border max-h-40 overflow-auto rounded border bg-agentprism-muted/20 p-2 font-mono text-xs">
              {argsStr}
            </pre>
          </div>
        )}
        {resultStr && (
          <div>
            <div className="text-agentprism-muted-foreground mb-1 text-xs font-medium">
              Result
            </div>
            <pre className="border-agentprism-border max-h-40 overflow-auto rounded border bg-agentprism-muted/20 p-2 font-mono text-xs">
              {resultStr}
            </pre>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

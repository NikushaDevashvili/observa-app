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
  const llmEvent = (data as any).events?.find((e: any) => e.event_type === "llm_call");
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
        normalizeAttributeValue(entry)
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
    (data as any).executed_tools ??
    getAttributeValue("observa.executed_tools");
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
      const modelAttr = attrs.find((a: any) => 
        a.key === "llm_call.model" || 
        a.key === "gen_ai.system.name" ||
        a.key === "gen_ai.request.model"
      );
      if (modelAttr?.value?.stringValue) {
        modelName = modelAttr.value.stringValue;
      }
    }
  }

  const hasInput = inputText !== null && inputText !== undefined && inputText !== "";
  const hasOutput = outputText !== null && outputText !== undefined && outputText !== "";

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

      <ContextSection
        title="System Instructions"
        value={systemInstructions}
      />
      <ContextSection title="Available Tools" value={availableTools} />
      <ContextSection title="Executed Tools" value={executedTools} />
      <ContextSection
        title="Attempted Tool Calls"
        value={attemptedToolCalls}
      />

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
    typeof value === "string" ? value : value ? JSON.stringify(value, null, 2) : "";
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

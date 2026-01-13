import type { TraceSpan } from "@evilmartians/agent-prism-types";
import type { ReactElement } from "react";

import { useState, useEffect } from "react";

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

      {/* Input Section - Always show, even if empty */}
      <IOSection
        section="Input"
        content={inputText || ""}
        parsedContent={parsedInput}
        isEmpty={!hasInput}
      />

      {/* Output Section - Show if available */}
      {(hasOutput || outputText === null) && (
        <IOSection
          section="Output"
          content={outputText || ""}
          parsedContent={parsedOutput}
          isEmpty={!hasOutput}
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
}

const IOSection = ({
  section,
  content,
  parsedContent,
  isEmpty = false,
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
            No {section.toLowerCase()} data available for this span
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

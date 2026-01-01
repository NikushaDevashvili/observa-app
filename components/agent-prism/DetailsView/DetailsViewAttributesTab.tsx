import { type TraceSpan } from "@evilmartians/agent-prism-types";
import { type ReactElement, useState } from "react";

import type { TabItem } from "../Tabs";

import { CollapsibleSection } from "../CollapsibleSection";
import { TabSelector } from "../TabSelector";
import {
  DetailsViewContentViewer,
  type DetailsViewContentViewMode,
} from "./DetailsViewContentViewer";

interface AttributesTabProps {
  data: TraceSpan;
}

const TAB_ITEMS: TabItem<DetailsViewContentViewMode>[] = [
  { value: "json", label: "JSON" },
  { value: "plain", label: "Plain" },
];

// Determine color based on attribute key prefix for better visual organization
const getAttributeKeyColor = (key: string): string => {
  const keyLower = key.toLowerCase();
  if (keyLower.startsWith("gen_ai.") || keyLower.startsWith("llm_")) {
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  } else if (keyLower.startsWith("tool.") || keyLower.startsWith("tool_")) {
    return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  } else if (
    keyLower.startsWith("retrieval.") ||
    keyLower.startsWith("retrieval_")
  ) {
    return "bg-purple-500/10 text-purple-400 border-purple-500/20";
  } else if (keyLower.startsWith("output.") || keyLower.startsWith("output_")) {
    return "bg-green-500/10 text-green-400 border-green-500/20";
  } else if (keyLower.includes("error") || keyLower.includes("status")) {
    return "bg-red-500/10 text-red-400 border-red-500/20";
  } else if (
    keyLower.includes("time") ||
    keyLower.includes("duration") ||
    keyLower.includes("latency")
  ) {
    return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  } else {
    return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
};

export const DetailsViewAttributesTab = ({
  data,
}: AttributesTabProps): ReactElement => {
  if (!data.attributes || data.attributes.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-agentprism-muted-foreground">
          No attributes available for this span.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.attributes.map((attribute, index) => {
        const stringValue = attribute.value.stringValue;
        const simpleValue =
          stringValue ||
          attribute.value.intValue?.toString() ||
          attribute.value.boolValue?.toString() ||
          "N/A";

        let parsedJson: string | null = null;
        if (typeof stringValue === "string") {
          try {
            parsedJson = JSON.parse(stringValue);
          } catch {
            parsedJson = null;
          }
        }

        const isComplex = parsedJson !== null;
        const keyColorClasses = getAttributeKeyColor(attribute.key);

        if (isComplex && parsedJson && stringValue) {
          return (
            <AttributeSection
              key={`${attribute.key}-${index}`}
              attributeKey={attribute.key}
              content={stringValue}
              parsedContent={parsedJson}
              id={`${data.id}-${attribute.key}-${index}`}
              keyColorClasses={keyColorClasses}
            />
          );
        }

        return (
          <div
            key={`${attribute.key}-${index}`}
            className="border-agentprism-border rounded-md border p-4"
          >
            <dt className="mb-1">
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${keyColorClasses}`}
              >
                {attribute.key}
              </span>
            </dt>
            <dd className="text-agentprism-foreground break-words text-sm mt-2">
              {simpleValue}
            </dd>
          </div>
        );
      })}
    </div>
  );
};

interface AttributeSectionProps {
  attributeKey: string;
  content: string;
  parsedContent: string;
  id: string;
  keyColorClasses: string;
}

const AttributeSection = ({
  attributeKey,
  content,
  parsedContent,
  id,
  keyColorClasses,
}: AttributeSectionProps): ReactElement => {
  const [tab, setTab] = useState<DetailsViewContentViewMode>("json");

  return (
    <div className="border-agentprism-border rounded-md border p-4">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${keyColorClasses}`}
        >
          {attributeKey}
        </span>
      </div>
      <CollapsibleSection
        title=""
        defaultOpen
        triggerClassName="hidden"
        rightContent={
          <TabSelector<DetailsViewContentViewMode>
            items={TAB_ITEMS}
            defaultValue="json"
            value={tab}
            onValueChange={setTab}
            theme="pill"
            onClick={(event) => event.stopPropagation()}
          />
        }
      >
        <DetailsViewContentViewer
          content={content}
          parsedContent={parsedContent}
          mode={tab}
          label={attributeKey}
          id={id}
        />
      </CollapsibleSection>
    </div>
  );
};

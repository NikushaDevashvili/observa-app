import type { TraceSpanCategory } from "@evilmartians/agent-prism-types";

import cn from "classnames";

import { Badge, type BadgeProps } from "./Badge";
import { getSpanCategoryIcon, getSpanCategoryLabel } from "./shared";
import { ThumbsUp, ThumbsDown, Star, MessageCircle } from "lucide-react";

export interface SpanBadgeProps
  extends Omit<BadgeProps, "label" | "iconStart" | "iconEnd"> {
  category: TraceSpanCategory;
  title?: string; // Add title prop to detect feedback
}

const badgeClasses: Record<TraceSpanCategory, string> = {
  llm_call: "bg-agentprism-badge-llm text-agentprism-badge-llm-foreground",
  tool_execution:
    "bg-agentprism-badge-tool text-agentprism-badge-tool-foreground",
  chain_operation:
    "bg-agentprism-badge-chain text-agentprism-badge-chain-foreground",
  retrieval:
    "bg-agentprism-badge-retrieval text-agentprism-badge-retrieval-foreground",
  embedding:
    "bg-agentprism-badge-embedding text-agentprism-badge-embedding-foreground",
  guardrail:
    "bg-agentprism-badge-guardrail text-agentprism-badge-guardrail-foreground",
  agent_invocation:
    "bg-agentprism-badge-agent text-agentprism-badge-agent-foreground",
  create_agent:
    "bg-agentprism-badge-create-agent text-agentprism-badge-create-agent-foreground",
  span: "bg-agentprism-badge-span text-agentprism-badge-span-foreground",
  event: "bg-agentprism-badge-event text-agentprism-badge-event-foreground",
  unknown:
    "bg-agentprism-badge-unknown text-agentprism-badge-unknown-foreground",
};

// Feedback-specific badge classes
const feedbackBadgeClasses: Record<string, string> = {
  like: "bg-green-100 text-green-700 border-green-300",
  dislike: "bg-red-100 text-red-700 border-red-300",
  rating: "bg-yellow-100 text-yellow-700 border-yellow-300",
  correction: "bg-blue-100 text-blue-700 border-blue-300",
};

// Detect feedback type from title
function detectFeedbackType(title?: string): string | null {
  if (!title) return null;
  if (title.includes("👍") || title.toLowerCase().includes("like")) return "like";
  if (title.includes("👎") || title.toLowerCase().includes("dislike")) return "dislike";
  if (title.includes("⭐") || title.toLowerCase().includes("rating")) return "rating";
  if (title.includes("✏️") || title.toLowerCase().includes("correction")) return "correction";
  return null;
}

export const SpanBadge = ({
  category,
  className,
  title,
  ...props
}: SpanBadgeProps) => {
  const feedbackType = detectFeedbackType(title);
  const isFeedback = feedbackType !== null;
  
  // Use feedback-specific styling if detected
  const badgeClass = isFeedback && feedbackType
    ? feedbackBadgeClasses[feedbackType] || badgeClasses[category]
    : badgeClasses[category];
  
  // Get icon - use feedback icon if detected, otherwise use category icon
  let Icon = getSpanCategoryIcon(category);
  if (isFeedback && feedbackType) {
    if (feedbackType === "like") Icon = ThumbsUp;
    else if (feedbackType === "dislike") Icon = ThumbsDown;
    else if (feedbackType === "rating") Icon = Star;
    else if (feedbackType === "correction") Icon = MessageCircle;
  }
  
  // Get label - use feedback label if detected
  let label = getSpanCategoryLabel(category);
  if (isFeedback && feedbackType) {
    label = feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1).toUpperCase();
  }

  return (
    <Badge
      className={cn(badgeClass, className)}
      iconStart={<Icon className="size-2.5" />}
      {...props}
      label={label}
      unstyled
    />
  );
};

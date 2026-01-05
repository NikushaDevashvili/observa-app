"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  ChevronDown,
  Clock,
  Zap,
  MessageSquare,
  Wrench,
  Database,
  AlertCircle,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Star,
  MessageCircle,
} from "lucide-react";

interface Span {
  id?: string;
  span_id: string;
  parent_span_id: string | null;
  original_span_id?: string; // Original span ID from events (for child spans)
  name: string;
  start_time: string;
  end_time: string;
  duration_ms: number;
  events: Event[];
  children?: Span[];
  metadata?: {
    model?: string | null;
    environment?: string | null;
    conversation_id?: string | null;
    session_id?: string | null;
    user_id?: string | null;
  };
  // Additional fields from backend
  details?: any;
  llm_call?: any;
  tool_call?: any;
  retrieval?: any;
  output?: any;
  feedback?: any;
  feedback_metadata?: {
    type?: string;
    outcome?: string;
    rating?: number | null;
    has_comment?: boolean;
    comment?: string | null;
    icon?: string;
    color_class?: string;
    bg_color_class?: string;
  };
  type?: string;
  hasDetails?: boolean;
  selectable?: boolean;
  event_type?: string;
}

interface Event {
  event_type: string;
  timestamp: string;
  attributes: any;
}

interface TraceWaterfallProps {
  spans: Span[];
  selectedSpanId: string | null;
  onSelectSpan: (spanId: string) => void;
}

export default function TraceWaterfall({
  spans,
  selectedSpanId,
  onSelectSpan,
}: TraceWaterfallProps) {
  const [expandedSpans, setExpandedSpans] = useState<Set<string>>(new Set());

  const toggleExpand = (spanId: string) => {
    const newExpanded = new Set(expandedSpans);
    if (newExpanded.has(spanId)) {
      newExpanded.delete(spanId);
    } else {
      newExpanded.add(spanId);
    }
    setExpandedSpans(newExpanded);
  };

  // Build tree structure
  // CRITICAL FIX: Use spans that already have children structure from backend
  // The backend now returns spans with children already built
  const buildTree = (spans: Span[]): Span[] => {
    // If spans already have children structure (from backend), use it
    // Otherwise, build it manually
    const hasChildrenStructure = spans.some((s) => s.children !== undefined);
    
    if (hasChildrenStructure) {
      // Backend already built the tree, just return root spans
      // CRITICAL: Ensure all spans (including children) have proper IDs
      const ensureIds = (spanList: Span[]): void => {
        spanList.forEach((span) => {
          // Ensure span has both id and span_id set
          if (!span.id && span.span_id) {
            span.id = span.span_id;
          }
          if (!span.span_id && span.id) {
            span.span_id = span.id;
          }
          // Recursively ensure children have IDs too
          if (span.children) {
            ensureIds(span.children);
          }
        });
      };
      
      const rootSpans = spans.filter((s) => !s.parent_span_id);
      ensureIds(rootSpans);
      return rootSpans;
    }
    
    // Fallback: Build tree manually (for backward compatibility)
    const spanMap = new Map<string, Span>();
    const rootSpans: Span[] = [];

    // Create map of all spans - use both id and span_id as keys
    spans.forEach((span) => {
      const spanId = span.span_id || span.id;
      if (spanId) {
        const spanCopy = { ...span };
        // Ensure both id and span_id are set
        if (!spanCopy.id) spanCopy.id = spanCopy.span_id;
        if (!spanCopy.span_id) spanCopy.span_id = spanCopy.id;
        
        spanMap.set(spanId, spanCopy);
        // Also index by both IDs
        if (span.id && span.id !== spanId) {
          spanMap.set(span.id, spanCopy);
        }
        if (span.span_id && span.span_id !== spanId) {
          spanMap.set(span.span_id, spanCopy);
        }
      }
    });

    // Build tree
    spans.forEach((span) => {
      const spanId = span.span_id || span.id;
      if (!spanId) return;
      
      const spanCopy = spanMap.get(spanId);
      if (!spanCopy) return;
      
      if (!span.parent_span_id) {
        rootSpans.push(spanCopy);
      } else {
        const parentId = span.parent_span_id;
        const parent = spanMap.get(parentId);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(spanCopy);
        } else {
          // Parent not found, treat as root
          rootSpans.push(spanCopy);
        }
      }
    });

    return rootSpans;
  };

  const getEventIcon = (eventType: string, feedbackType?: string) => {
    switch (eventType) {
      case "llm_call":
        return <MessageSquare className="h-4 w-4" />;
      case "tool_call":
        return <Wrench className="h-4 w-4" />;
      case "retrieval":
        return <Database className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "feedback":
        // Use specific icons for feedback types
        if (feedbackType === "like") {
          return <ThumbsUp className="h-4 w-4 text-green-600" />;
        } else if (feedbackType === "dislike") {
          return <ThumbsDown className="h-4 w-4 text-red-600" />;
        } else if (feedbackType === "rating") {
          return <Star className="h-4 w-4 text-yellow-600" />;
        } else if (feedbackType === "correction") {
          return <MessageCircle className="h-4 w-4 text-blue-600" />;
        }
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getEventColor = (eventType: string, feedbackType?: string) => {
    switch (eventType) {
      case "llm_call":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "tool_call":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "retrieval":
        return "bg-green-100 text-green-700 border-green-200";
      case "error":
        return "bg-red-100 text-red-700 border-red-200";
      case "feedback":
        // Distinct colors for feedback types
        if (feedbackType === "like") {
          return "bg-green-50 text-green-700 border-green-300 border-2";
        } else if (feedbackType === "dislike") {
          return "bg-red-50 text-red-700 border-red-300 border-2";
        } else if (feedbackType === "rating") {
          return "bg-yellow-50 text-yellow-700 border-yellow-300 border-2";
        } else if (feedbackType === "correction") {
          return "bg-blue-50 text-blue-700 border-blue-300 border-2";
        }
        return "bg-gray-50 text-gray-700 border-gray-300 border-2";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const renderSpan = (span: Span & { children?: Span[] }, depth: number = 0) => {
    // CRITICAL FIX: Use span_id as primary ID, fallback to id
    // This ensures consistency with backend lookup maps
    const spanId = span.span_id || span.id || '';
    const altSpanId = span.id || span.span_id || '';
    const isExpanded = expandedSpans.has(spanId) || expandedSpans.has(altSpanId) || expandedSpans.has(span.span_id || '');
    const isSelected = selectedSpanId === spanId || selectedSpanId === altSpanId || selectedSpanId === span.span_id;
    const hasChildren = span.children && span.children.length > 0;

    return (
      <div key={spanId || altSpanId} className="mb-2">
        <Card
          className={`cursor-pointer transition-colors ${
            isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
          } ${
            // Distinct styling for feedback spans
            span.type === "feedback" || span.event_type === "feedback"
              ? span.feedback_metadata?.bg_color_class || 
                (span.feedback_metadata?.type === "like" ? "bg-green-50 border-green-200" :
                 span.feedback_metadata?.type === "dislike" ? "bg-red-50 border-red-200" :
                 span.feedback_metadata?.type === "rating" ? "bg-yellow-50 border-yellow-200" :
                 span.feedback_metadata?.type === "correction" ? "bg-blue-50 border-blue-200" :
                 "bg-gray-50 border-gray-200")
              : ""
          }`}
          onClick={(e) => {
            // CRITICAL FIX: Don't collapse when clicking on span, just select it
            // Only collapse/expand when clicking the chevron button
            e.stopPropagation();
            
            // Try both ID formats to ensure we find the span
            // Prefer span_id as it's more consistent with backend
            const idToSelect = span.span_id || span.id || spanId;
            if (idToSelect) {
              onSelectSpan(idToSelect);
              
              // Auto-expand parent when selecting a child span
              if (span.parent_span_id) {
                const parentId = span.parent_span_id;
                if (!expandedSpans.has(parentId)) {
                  const newExpanded = new Set(expandedSpans);
                  newExpanded.add(parentId);
                  setExpandedSpans(newExpanded);
                }
              }
            }
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Indentation and expand/collapse */}
              <div className="flex items-center gap-1" style={{ marginLeft: `${depth * 24}px` }}>
                {hasChildren ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Use the same ID format for consistency
                      const idToToggle = span.span_id || span.id || spanId;
                      toggleExpand(idToToggle);
                    }}
                    className="p-1 hover:bg-muted rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <div className="w-6" />
                )}
              </div>

              {/* Span content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {/* Feedback icon for feedback spans */}
                  {span.type === "feedback" || span.event_type === "feedback" ? (
                    <div className="flex items-center gap-2">
                      {getEventIcon("feedback", span.feedback_metadata?.type || span.feedback?.type)}
                      <h3 className={`font-semibold text-sm ${
                        span.feedback_metadata?.type === "like" ? "text-green-700" :
                        span.feedback_metadata?.type === "dislike" ? "text-red-700" :
                        span.feedback_metadata?.type === "rating" ? "text-yellow-700" :
                        span.feedback_metadata?.type === "correction" ? "text-blue-700" :
                        ""
                      }`}>
                        {span.name}
                      </h3>
                      {span.feedback_metadata?.has_comment && (
                        <MessageCircle className="h-3 w-3 text-muted-foreground" title="Has comment" />
                      )}
                    </div>
                  ) : (
                    <h3 className="font-semibold text-sm">{span.name}</h3>
                  )}
                  {span.metadata?.model && (
                    <Badge variant="outline" className="text-xs">
                      {span.metadata.model}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                    <Clock className="h-3 w-3" />
                    {span.duration_ms}ms
                  </div>
                </div>

                {/* Events */}
                {isExpanded && span.events && span.events.length > 0 && (
                  <div className="ml-6 mt-2 space-y-1">
                    {span.events.map((event, idx) => {
                      const feedbackType = event.event_type === "feedback" 
                        ? (event.attributes?.feedback?.type || span.feedback_metadata?.type)
                        : undefined;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 p-2 rounded border text-xs ${getEventColor(
                            event.event_type,
                            feedbackType
                          )}`}
                        >
                          {getEventIcon(event.event_type, feedbackType)}
                          <span className="font-medium">
                            {event.event_type === "feedback" && feedbackType
                              ? `${feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1)} Feedback`
                              : event.event_type.replace("_", " ")}
                          </span>
                          {event.attributes?.llm_call?.total_tokens && (
                            <span className="text-xs opacity-75">
                              {event.attributes.llm_call.total_tokens} tokens
                            </span>
                          )}
                          {event.attributes?.tool_call?.tool_name && (
                            <span className="text-xs opacity-75">
                              {event.attributes.tool_call.tool_name}
                            </span>
                          )}
                          {event.event_type === "feedback" && event.attributes?.feedback?.comment && (
                            <span className="text-xs opacity-75 flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              Has comment
                            </span>
                          )}
                          {event.event_type === "feedback" && event.attributes?.feedback?.rating && (
                            <span className="text-xs opacity-75 flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {event.attributes.feedback.rating}/5
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="ml-4">
            {span.children!.map((child) => renderSpan(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const treeSpans = buildTree(spans);

  return (
    <div className="border-1 p-4">
      <h2 className="text-lg font-semibold mb-4">Trace Timeline</h2>
      <ScrollArea className="h-[600px]">
        <div className="space-y-2">
          {treeSpans.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No spans found
            </div>
          ) : (
            treeSpans.map((span) => renderSpan(span, 0))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}


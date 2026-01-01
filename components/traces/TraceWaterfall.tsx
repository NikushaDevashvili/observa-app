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
} from "lucide-react";

interface Span {
  id?: string;
  span_id: string;
  parent_span_id: string | null;
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
  type?: string;
  hasDetails?: boolean;
  selectable?: boolean;
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
      return spans.filter((s) => !s.parent_span_id);
    }
    
    // Fallback: Build tree manually (for backward compatibility)
    const spanMap = new Map<string, Span>();
    const rootSpans: Span[] = [];

    // Create map of all spans
    spans.forEach((span) => {
      const spanId = span.id || span.span_id;
      spanMap.set(spanId, { ...span });
      spanMap.set(span.span_id, spanMap.get(spanId)!); // Also index by span_id
    });

    // Build tree
    spans.forEach((span) => {
      const spanId = span.id || span.span_id;
      const spanCopy = spanMap.get(spanId)!;
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

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "llm_call":
        return <MessageSquare className="h-4 w-4" />;
      case "tool_call":
        return <Wrench className="h-4 w-4" />;
      case "retrieval":
        return <Database className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "llm_call":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "tool_call":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "retrieval":
        return "bg-green-100 text-green-700 border-green-200";
      case "error":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const renderSpan = (span: Span & { children?: Span[] }, depth: number = 0) => {
    const spanId = span.id || span.span_id; // Use id if available, fallback to span_id
    const isExpanded = expandedSpans.has(spanId) || expandedSpans.has(span.span_id);
    const isSelected = selectedSpanId === spanId || selectedSpanId === span.span_id;
    const hasChildren = span.children && span.children.length > 0;

    return (
      <div key={spanId} className="mb-2">
        <Card
          className={`cursor-pointer transition-colors ${
            isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
          }`}
          onClick={(e) => {
            // CRITICAL FIX: Don't collapse when clicking on span, just select it
            // Only collapse/expand when clicking the chevron button
            e.stopPropagation();
            onSelectSpan(spanId);
            // Auto-expand parent when selecting a child span
            if (span.parent_span_id) {
              const parentId = span.parent_span_id;
              if (!expandedSpans.has(parentId)) {
                const newExpanded = new Set(expandedSpans);
                newExpanded.add(parentId);
                setExpandedSpans(newExpanded);
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
                      const idToToggle = spanId;
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
                  <h3 className="font-semibold text-sm">{span.name}</h3>
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
                    {span.events.map((event, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 p-2 rounded border text-xs ${getEventColor(
                          event.event_type
                        )}`}
                      >
                        {getEventIcon(event.event_type)}
                        <span className="font-medium">
                          {event.event_type.replace("_", " ")}
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
                      </div>
                    ))}
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


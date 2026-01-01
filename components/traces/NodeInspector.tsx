"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SafeText } from "@/components/SafeHTML";
import {
  MessageSquare,
  Wrench,
  Database,
  AlertCircle,
  Clock,
  Zap,
  Code,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
  type?: string;
  hasDetails?: boolean;
  selectable?: boolean;
}

interface Event {
  event_type: string;
  timestamp: string;
  attributes: any;
}

interface NodeInspectorProps {
  span: Span | null;
}

export default function NodeInspector({ span }: NodeInspectorProps) {
  const [viewMode, setViewMode] = useState<"preview" | "json">("preview");

  if (!span) {
    return (
      <div className="border-1 p-4 h-full flex items-center justify-center text-muted-foreground">
        Select a span to view details
      </div>
    );
  }

  // CRITICAL FIX: Use span data directly if available (from backend flattening)
  // Fallback to events if span data not available
  const llmData = span.llm_call || span.details?.llm_call;
  const toolData = span.tool_call || span.details?.tool_call;
  const retrievalData = span.retrieval || span.details?.retrieval;
  const outputData = span.output || span.details?.output;
  
  // Also check events for backward compatibility
  const llmEvent = span.events?.find((e) => e.event_type === "llm_call");
  const toolEvents = span.events?.filter((e) => e.event_type === "tool_call") || [];
  const retrievalEvent = span.events?.find((e) => e.event_type === "retrieval");
  
  // Use span data if available, otherwise use event data
  const llmCall = llmData || llmEvent?.attributes?.llm_call;
  const toolCalls = toolData ? [toolData] : toolEvents.map((e) => e.attributes?.tool_call).filter(Boolean);
  const retrieval = retrievalData || retrievalEvent?.attributes?.retrieval;

  return (
    <div className="border-1 p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Node Details</h2>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "preview" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("preview")}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            variant={viewMode === "json" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("json")}
          >
            <Code className="h-4 w-4 mr-2" />
            JSON
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {viewMode === "json" ? (
          <Card>
            <CardContent className="p-4">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(span, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Span Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{span.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Duration</div>
                    <div className="font-medium">{span.duration_ms}ms</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Start Time</div>
                    <div className="font-medium">
                      {new Date(span.start_time).toLocaleString()}
                    </div>
                  </div>
                  {span.metadata?.model && (
                    <div>
                      <div className="text-muted-foreground">Model</div>
                      <div className="font-medium">{span.metadata.model}</div>
                    </div>
                  )}
                  {span.metadata?.environment && (
                    <div>
                      <div className="text-muted-foreground">Environment</div>
                      <Badge variant="outline">
                        {span.metadata.environment.toUpperCase()}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* LLM Call */}
            {llmCall && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <CardTitle className="text-base">LLM Call</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {llmCall?.input && (
                    <div>
                      <div className="text-sm font-medium mb-2">Input</div>
                      <div className="bg-muted p-3 rounded-md">
                        <SafeText
                          content={llmCall.input}
                          preserveWhitespace
                        />
                      </div>
                    </div>
                  )}
                  {llmCall?.output && (
                    <div>
                      <div className="text-sm font-medium mb-2">Output</div>
                      <div className="bg-muted p-3 rounded-md max-h-96 overflow-auto">
                        <SafeText
                          content={llmCall.output}
                          preserveWhitespace
                        />
                      </div>
                    </div>
                  )}
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {llmCall?.input_tokens !== null &&
                      llmCall?.input_tokens !== undefined && (
                        <div>
                          <div className="text-muted-foreground">Input Tokens</div>
                          <div className="font-medium">
                            {llmCall.input_tokens.toLocaleString()}
                          </div>
                        </div>
                      )}
                    {llmCall?.output_tokens !== null &&
                      llmCall?.output_tokens !== undefined && (
                        <div>
                          <div className="text-muted-foreground">Output Tokens</div>
                          <div className="font-medium">
                            {llmCall.output_tokens.toLocaleString()}
                          </div>
                        </div>
                      )}
                    {llmCall?.latency_ms !== null &&
                      llmCall?.latency_ms !== undefined && (
                        <div>
                          <div className="text-muted-foreground">Latency</div>
                          <div className="font-medium">
                            {llmCall.latency_ms}ms
                          </div>
                        </div>
                      )}
                    {llmCall?.finish_reason && (
                      <div>
                        <div className="text-muted-foreground">Finish Reason</div>
                        <div className="font-medium">
                          {llmCall.finish_reason}
                        </div>
                      </div>
                    )}
                    {llmCall?.model && (
                      <div>
                        <div className="text-muted-foreground">Model</div>
                        <div className="font-medium">
                          {llmCall.model}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tool Calls */}
            {toolCalls.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    <CardTitle className="text-base">
                      Tool Calls ({toolCalls.length})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {toolCalls.map((toolCall, idx) => (
                    <div key={idx}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">
                          {toolCall?.tool_name || "Unknown Tool"}
                        </span>
                        <Badge
                          variant={
                            toolCall?.result_status === "success"
                              ? "default"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {toolCall?.result_status || "unknown"}
                        </Badge>
                      </div>
                      {toolCall?.args && (
                        <div className="bg-muted p-2 rounded text-xs mb-2">
                          <pre>{JSON.stringify(toolCall.args, null, 2)}</pre>
                        </div>
                      )}
                      {toolCall?.result && (
                        <div className="bg-muted p-2 rounded text-xs">
                          <div className="text-muted-foreground mb-1">Result:</div>
                          <pre>
                            {JSON.stringify(toolCall.result, null, 2)}
                          </pre>
                        </div>
                      )}
                      {toolCall?.error_message && (
                        <div className="text-destructive text-sm">
                          {toolCall.error_message}
                        </div>
                      )}
                      {toolCall?.latency_ms !== null && toolCall?.latency_ms !== undefined && (
                        <div className="text-sm text-muted-foreground mt-2">
                          Latency: {toolCall.latency_ms}ms
                        </div>
                      )}
                      {idx < toolCalls.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Retrieval */}
            {retrieval && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <CardTitle className="text-base">Retrieval</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {retrieval.k && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Top K: </span>
                      <span className="font-medium">{retrieval.k}</span>
                    </div>
                  )}
                  {retrieval.latency_ms !== null &&
                    retrieval.latency_ms !== undefined && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Latency: </span>
                        <span className="font-medium">{retrieval.latency_ms}ms</span>
                      </div>
                    )}
                  {retrieval.retrieval_context && (
                    <div>
                      <div className="text-sm font-medium mb-2">Retrieval Context</div>
                      <div className="bg-muted p-3 rounded-md max-h-96 overflow-auto">
                        <SafeText
                          content={retrieval.retrieval_context}
                          preserveWhitespace
                        />
                      </div>
                    </div>
                  )}
                  {retrieval.retrieval_context_ids && retrieval.retrieval_context_ids.length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Context IDs: </span>
                      <span className="font-medium">
                        {retrieval.retrieval_context_ids.join(", ")}
                      </span>
                    </div>
                  )}
                  {retrieval.similarity_scores && retrieval.similarity_scores.length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Similarity Scores: </span>
                      <span className="font-medium">
                        {retrieval.similarity_scores.map((s: number) => s.toFixed(3)).join(", ")}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Output */}
            {outputData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <CardTitle className="text-base">Output</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {outputData.final_output && (
                    <div>
                      <div className="text-sm font-medium mb-2">Final Output</div>
                      <div className="bg-muted p-3 rounded-md max-h-96 overflow-auto">
                        <SafeText
                          content={outputData.final_output}
                          preserveWhitespace
                        />
                      </div>
                    </div>
                  )}
                  {outputData.output_length !== null && outputData.output_length !== undefined && (
                    <div className="text-sm mt-3">
                      <span className="text-muted-foreground">Output Length: </span>
                      <span className="font-medium">{outputData.output_length} characters</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            {span.metadata && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {span.metadata.conversation_id && (
                      <div>
                        <span className="text-muted-foreground">Conversation ID: </span>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {span.metadata.conversation_id}
                        </code>
                      </div>
                    )}
                    {span.metadata.session_id && (
                      <div>
                        <span className="text-muted-foreground">Session ID: </span>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {span.metadata.session_id}
                        </code>
                      </div>
                    )}
                    {span.metadata.user_id && (
                      <div>
                        <span className="text-muted-foreground">User ID: </span>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {span.metadata.user_id}
                        </code>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}


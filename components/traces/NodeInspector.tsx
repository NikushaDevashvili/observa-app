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
  span_id: string;
  parent_span_id: string | null;
  name: string;
  start_time: string;
  end_time: string;
  duration_ms: number;
  events: Event[];
  metadata?: {
    model?: string | null;
    environment?: string | null;
    conversation_id?: string | null;
    session_id?: string | null;
    user_id?: string | null;
  };
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

  const llmEvent = span.events.find((e) => e.event_type === "llm_call");
  const toolEvents = span.events.filter((e) => e.event_type === "tool_call");
  const retrievalEvent = span.events.find((e) => e.event_type === "retrieval");

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
            {llmEvent && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <CardTitle className="text-base">LLM Call</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {llmEvent.attributes?.llm_call?.input && (
                    <div>
                      <div className="text-sm font-medium mb-2">Input</div>
                      <div className="bg-muted p-3 rounded-md">
                        <SafeText
                          content={llmEvent.attributes.llm_call.input}
                          preserveWhitespace
                        />
                      </div>
                    </div>
                  )}
                  {llmEvent.attributes?.llm_call?.output && (
                    <div>
                      <div className="text-sm font-medium mb-2">Output</div>
                      <div className="bg-muted p-3 rounded-md max-h-96 overflow-auto">
                        <SafeText
                          content={llmEvent.attributes.llm_call.output}
                          preserveWhitespace
                        />
                      </div>
                    </div>
                  )}
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {llmEvent.attributes?.llm_call?.input_tokens !== null &&
                      llmEvent.attributes?.llm_call?.input_tokens !==
                        undefined && (
                        <div>
                          <div className="text-muted-foreground">Input Tokens</div>
                          <div className="font-medium">
                            {llmEvent.attributes.llm_call.input_tokens.toLocaleString()}
                          </div>
                        </div>
                      )}
                    {llmEvent.attributes?.llm_call?.output_tokens !== null &&
                      llmEvent.attributes?.llm_call?.output_tokens !==
                        undefined && (
                        <div>
                          <div className="text-muted-foreground">Output Tokens</div>
                          <div className="font-medium">
                            {llmEvent.attributes.llm_call.output_tokens.toLocaleString()}
                          </div>
                        </div>
                      )}
                    {llmEvent.attributes?.llm_call?.latency_ms !== null &&
                      llmEvent.attributes?.llm_call?.latency_ms !== undefined && (
                        <div>
                          <div className="text-muted-foreground">Latency</div>
                          <div className="font-medium">
                            {llmEvent.attributes.llm_call.latency_ms}ms
                          </div>
                        </div>
                      )}
                    {llmEvent.attributes?.llm_call?.finish_reason && (
                      <div>
                        <div className="text-muted-foreground">Finish Reason</div>
                        <div className="font-medium">
                          {llmEvent.attributes.llm_call.finish_reason}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tool Calls */}
            {toolEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    <CardTitle className="text-base">
                      Tool Calls ({toolEvents.length})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {toolEvents.map((event, idx) => (
                    <div key={idx}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">
                          {event.attributes?.tool_call?.tool_name || "Unknown Tool"}
                        </span>
                        <Badge
                          variant={
                            event.attributes?.tool_call?.result_status === "success"
                              ? "default"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {event.attributes?.tool_call?.result_status}
                        </Badge>
                      </div>
                      {event.attributes?.tool_call?.args && (
                        <div className="bg-muted p-2 rounded text-xs mb-2">
                          <pre>{JSON.stringify(event.attributes.tool_call.args, null, 2)}</pre>
                        </div>
                      )}
                      {event.attributes?.tool_call?.result && (
                        <div className="bg-muted p-2 rounded text-xs">
                          <div className="text-muted-foreground mb-1">Result:</div>
                          <pre>
                            {JSON.stringify(event.attributes.tool_call.result, null, 2)}
                          </pre>
                        </div>
                      )}
                      {event.attributes?.tool_call?.error_message && (
                        <div className="text-destructive text-sm">
                          {event.attributes.tool_call.error_message}
                        </div>
                      )}
                      {idx < toolEvents.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Retrieval */}
            {retrievalEvent && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <CardTitle className="text-base">Retrieval</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {retrievalEvent.attributes?.retrieval?.k && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Top K: </span>
                      <span className="font-medium">
                        {retrievalEvent.attributes.retrieval.k}
                      </span>
                    </div>
                  )}
                  {retrievalEvent.attributes?.retrieval?.latency_ms !== null &&
                    retrievalEvent.attributes?.retrieval?.latency_ms !== undefined && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Latency: </span>
                        <span className="font-medium">
                          {retrievalEvent.attributes.retrieval.latency_ms}ms
                        </span>
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


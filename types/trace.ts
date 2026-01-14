/**
 * Type definitions for trace and span data
 * Updated for SOTA span tracking with OTEL compliance
 */

import type { TraceSpanCategory } from "@evilmartians/agent-prism-types";

/**
 * Extended span type to include all new SOTA span types
 */
export type SpanType =
  | "llm_call"
  | "tool_execution"
  | "retrieval"
  | "embedding" // ✅ NEW: Embedding operations
  | "vector_db_operation" // ✅ NEW: Vector database operations
  | "cache_operation" // ✅ NEW: Cache hit/miss operations
  | "agent_create" // ✅ NEW: Agent creation
  | "agent_invocation"
  | "chain_operation"
  | "span"
  | "event"
  | "guardrail"
  | "unknown";

/**
 * OTEL attribute groups for better organization
 */
export type OtelAttributeGroup =
  | "operation"
  | "provider"
  | "usage"
  | "request"
  | "response"
  | "server"
  | "error"
  | "tool"
  | "retrieval"
  | "embedding"
  | "vector_db"
  | "cache"
  | "agent"
  | "other";

/**
 * Cost-related attributes
 */
export interface CostAttributes {
  input_cost?: number;
  output_cost?: number;
  total_cost?: number;
  cost?: number;
}

/**
 * Embedding span specific data
 */
export interface EmbeddingSpanData {
  model?: string;
  dimension_count?: number;
  encoding_formats?: string[];
  input_tokens?: number;
  output_tokens?: number;
  latency_ms?: number;
  cost?: number;
  embeddings_count?: number;
  embeddings_preview?: string[];
}

/**
 * Vector DB operation data
 */
export interface VectorDbOperationData {
  operation_type?: "vector_search" | "index_upsert" | "delete" | string;
  index_name?: string;
  vector_dimensions?: number;
  results_count?: number;
  latency_ms?: number;
  cost?: number;
  provider_name?: string;
}

/**
 * Cache operation data
 */
export interface CacheOperationData {
  cache_backend?: "redis" | "in_memory" | "memcached" | string;
  hit_status?: "hit" | "miss";
  latency_ms?: number;
  saved_cost?: number;
  ttl?: number;
}

/**
 * Agent creation data
 */
export interface AgentCreateData {
  agent_name?: string;
  tools_bound?: string[];
  model_config?: Record<string, any>;
}

/**
 * Filter options for trace lists
 */
export interface SpanTypeFilter {
  value: SpanType;
  label: string;
  count?: number;
}

/**
 * Default span type filters
 */
export const DEFAULT_SPAN_TYPE_FILTERS: SpanTypeFilter[] = [
  { value: "llm_call", label: "LLM Calls" },
  { value: "tool_execution", label: "Tool Calls" },
  { value: "retrieval", label: "Retrieval" },
  { value: "embedding", label: "Embeddings" },
  { value: "vector_db_operation", label: "Vector DB" },
  { value: "cache_operation", label: "Cache" },
  { value: "agent_create", label: "Agent Create" },
  { value: "agent_invocation", label: "Agent Invocation" },
  { value: "chain_operation", label: "Chain Operation" },
];

/**
 * Helper to check if a span type is a new SOTA type
 */
export function isNewSotaSpanType(type: SpanType | TraceSpanCategory): boolean {
  return [
    "embedding",
    "vector_db_operation",
    "cache_operation",
    "agent_create",
  ].includes(type as string);
}

/**
 * Helper to get display name for span type
 */
export function getSpanTypeDisplayName(
  type: SpanType | TraceSpanCategory
): string {
  const filter = DEFAULT_SPAN_TYPE_FILTERS.find((f) => f.value === type);
  return filter?.label || type.toUpperCase().replace(/_/g, " ");
}

export interface TraceSummary {
  trace_id: string;
  tenant_id: string;
  project_id: string;
  environment?: string | null;
  conversation_id?: string | null;
  session_id?: string | null;
  user_id?: string | null;
  message_index?: number | null;
  start_time: string;
  end_time: string;
  total_latency_ms?: number | null;
  total_tokens?: number | null;
  total_cost?: number | null;
  model?: string | null;
  query?: string | null;
  response?: string | null;
  finish_reason?: string | null;
  status?: number | null;
  status_text?: string | null;
  response_length?: number | null;
  time_to_first_token_ms?: number | null;
  streaming_duration_ms?: number | null;
  analyzed_at?: string | null;
}

export interface TraceSignal {
  signal_type?: string;
  severity?: "high" | "medium" | "low" | string;
  confidence?: number | null;
  score?: number | null;
  reasoning?: string | null;
}

export interface TraceAnalysis {
  isHallucination?: boolean | null;
  hallucinationConfidence?: number | null;
  hallucinationReasoning?: string | null;
  qualityScore?: number | null;
  coherenceScore?: number | null;
  relevanceScore?: number | null;
  helpfulnessScore?: number | null;
  hasContextDrop?: boolean | null;
  hasModelDrift?: boolean | null;
  hasPromptInjection?: boolean | null;
  hasContextOverflow?: boolean | null;
  hasFaithfulnessIssue?: boolean | null;
  hasCostAnomaly?: boolean | null;
  hasLatencyAnomaly?: boolean | null;
  hasQualityDegradation?: boolean | null;
  contextRelevanceScore?: number | null;
  answerFaithfulnessScore?: number | null;
  driftScore?: number | null;
  anomalyScore?: number | null;
  analysisModel?: string | null;
  analysisVersion?: string | null;
  processingTimeMs?: number | null;
}

export interface TraceCostBreakdown {
  totalCostUsd?: number | null;
  byType?: Record<string, number>;
  topSpans?: Array<{ spanId: string; name: string; costUsd: number }>;
}

export interface TracePerformanceAnalysis {
  bottleneckSpanId?: string | null;
  bottleneckDurationMs?: number | null;
  bottleneckPercentage?: number | null;
  suggestions?: string[];
}

export interface TraceTokenEfficiency {
  tokensPerCharacter?: number | null;
  inputEfficiency?: number | null;
  outputEfficiency?: number | null;
  benchmarkComparison?: "above_average" | "average" | "below_average" | string;
}

export interface TraceQualityExplanation {
  overallScore?: number | null;
  breakdown?: Record<
    string,
    { score?: number | null; explanation?: string | null }
  >;
  improvements?: string[];
}

export interface TraceConversationContext {
  id: string;
  messageIndex?: number | null;
  totalMessages?: number | null;
  previousTraceId?: string | null;
  nextTraceId?: string | null;
  conversationMetrics?: {
    totalTokens?: number | null;
    avgLatencyMs?: number | null;
    totalCostUsd?: number | null;
    issueCount?: number | null;
  };
}

export interface TraceTree {
  summary: TraceSummary;
  spans: Array<Record<string, any>>;
  allSpans?: Array<Record<string, any>>;
  spansById?: Record<string, Record<string, any>>;
  signals?: TraceSignal[];
  analysis?: TraceAnalysis | Record<string, any>;
  costBreakdown?: TraceCostBreakdown;
  performanceAnalysis?: TracePerformanceAnalysis;
  tokenEfficiency?: TraceTokenEfficiency;
  qualityExplanation?: TraceQualityExplanation;
  _meta?: Record<string, any>;
}


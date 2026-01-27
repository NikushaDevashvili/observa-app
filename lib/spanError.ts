/**
 * Helpers to derive error information from span data when the backend
 * doesn't provide errorInfo (e.g. OTEL exception.* attributes only).
 *
 * We never infer errors from latency. We only use explicit signals:
 * - span.errorInfo (backend)
 * - span.status === "error" (OTEL / backend)
 * - span.type or span.event_type === "error"
 * - exception.* / error.* attributes
 */

export interface DerivedErrorInfo {
  type: string;
  message: string;
  fullMessage: string;
  stackTrace?: string;
  context?: Record<string, unknown>;
  timestamp?: string;
  errorCode?: string;
  classification?: {
    category?: string;
    severity?: string;
    impact?: string;
  };
}

function normalizeAttributeValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") return value;
  const v = value as Record<string, unknown>;
  if ("stringValue" in v) return v.stringValue;
  if ("boolValue" in v) return v.boolValue;
  if ("intValue" in v) return v.intValue;
  if ("doubleValue" in v) return v.doubleValue;
  if ("arrayValue" in v && Array.isArray((v.arrayValue as any)?.values)) {
    return (v.arrayValue as any).values.map((entry: unknown) =>
      normalizeAttributeValue(entry)
    );
  }
  if ("kvlistValue" in v && Array.isArray((v.kvlistValue as any)?.values)) {
    const mapped: Record<string, unknown> = {};
    (v.kvlistValue as any).values.forEach((entry: any) => {
      if (entry?.key) mapped[entry.key] = normalizeAttributeValue(entry.value);
    });
    return mapped;
  }
  if ("value" in v) return normalizeAttributeValue(v.value);
  return value;
}

function getAttributeValue(span: Record<string, unknown>, key: string): unknown {
  const attributes = span.attributes;
  if (!attributes) return null;
  if (Array.isArray(attributes)) {
    const match = (attributes as Array<{ key?: string; value?: unknown }>).find(
      (attr) => attr.key === key
    );
    return normalizeAttributeValue(match?.value) ?? null;
  }
  if (typeof attributes === "object" && key in (attributes as object)) {
    return normalizeAttributeValue(
      (attributes as Record<string, unknown>)[key]
    );
  }
  return null;
}

function getAttrString(span: Record<string, unknown>, key: string): string | null {
  const v = getAttributeValue(span, key);
  if (v == null) return null;
  if (typeof v === "string") return v;
  return String(v);
}

/**
 * Derive ErrorInfo-like data from span attributes when errorInfo is missing.
 * Supports OTEL exception.*, error.*, and common backend-specific keys.
 */
export function deriveErrorInfoFromSpan(span: unknown): DerivedErrorInfo | null {
  if (span == null || typeof span !== "object") return null;
  const s = span as Record<string, unknown>;
  const status = s.status as string | undefined;
  const type = (s.type ?? s.event_type ?? getAttrString(s, "event_type") ?? getAttrString(s, "type")) as string | undefined;
  const explicitErrorStatus = status === "error";
  const explicitErrorType =
    type === "error" ||
    (typeof type === "string" && type.toLowerCase() === "error");
  const isErrorSpan = explicitErrorStatus || explicitErrorType;

  const message =
    getAttrString(s, "exception.message") ??
    getAttrString(s, "error.message") ??
    getAttrString(s, "error") ??
    getAttrString(s, "message") ??
    (s as any).message;
  const errorType =
    getAttrString(s, "exception.type") ??
    getAttrString(s, "error.type") ??
    (isErrorSpan ? "error" : null);
  const stackTrace =
    getAttrString(s, "exception.stacktrace") ??
    getAttrString(s, "exception.stack_trace") ??
    getAttrString(s, "error.stacktrace") ??
    getAttrString(s, "error.stack_trace") ??
    (s as any).stackTrace ??
    (s as any).stack_trace;

  const hasExplicitError =
    message != null && String(message).trim() !== "";
  const hasErrorAttrs =
    errorType != null ||
    getAttributeValue(s, "exception.message") != null ||
    getAttributeValue(s, "error.message") != null;

  if (!isErrorSpan && !hasExplicitError && !hasErrorAttrs) {
    return null;
  }

  const fullMessage =
    typeof message === "string" && message.trim()
      ? message
      : isErrorSpan
        ? "Error recorded (no message in span). Check the Attributes tab for details."
        : "Error details not available";

  const context: Record<string, unknown> = {};
  const attrs = s.attributes;
  if (Array.isArray(attrs)) {
    for (const attr of attrs as Array<{ key?: string; value?: unknown }>) {
      if (attr.key && !["exception.message", "exception.type", "exception.stacktrace", "exception.stack_trace", "error.message", "error.type", "error.stacktrace", "error.stack_trace", "error", "message"].includes(attr.key)) {
        const v = normalizeAttributeValue(attr.value);
        if (v != null) context[attr.key] = v;
      }
    }
  }

  const timestamp =
    getAttrString(s, "exception.timestamp") ??
    (typeof (s as any).timestamp === "string"
      ? (s as any).timestamp
      : (s as any).startTime);

  return {
    type: errorType ?? "unknown",
    message: fullMessage,
    fullMessage,
    stackTrace: stackTrace ?? undefined,
    context: Object.keys(context).length > 0 ? context : undefined,
    timestamp: timestamp ?? undefined,
  };
}

/**
 * Whether the span should be treated as an error for UI (Error tab, etc.).
 * Uses only explicit signals: errorInfo, status, type/event_type, exception attrs.
 * Never infers from latency or other metrics.
 */
export function isErrorSpan(span: unknown): boolean {
  if (span == null || typeof span !== "object") return false;
  const s = span as Record<string, unknown>;
  if ((s as any).errorInfo) return true;
  if (s.status === "error") return true;
  const derived = deriveErrorInfoFromSpan(span);
  return derived != null;
}

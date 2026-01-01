"use client";

import { sanitizeHTML, sanitizeText } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import React from "react";

interface SafeHTMLProps {
  content: string;
  as?: "div" | "span" | "p" | "pre";
  className?: string;
  sanitize?: boolean; // Default: true
  preserveWhitespace?: boolean; // For code/pre blocks
}

/**
 * SafeHTML component - renders sanitized HTML content
 * Always sanitizes by default to prevent XSS attacks
 */
export function SafeHTML({
  content,
  as: Component = "div",
  className,
  sanitize = true,
  preserveWhitespace = false,
}: SafeHTMLProps) {
  const sanitized = sanitize ? sanitizeHTML(content) : content;

  return (
    <Component
      className={cn(
        preserveWhitespace && "whitespace-pre-wrap break-words",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

/**
 * SafeText component - renders plain text (strips all HTML)
 */
export function SafeText({
  content,
  as: Component = "div",
  className,
  preserveWhitespace = false,
}: Omit<SafeHTMLProps, "sanitize">) {
  const sanitized = sanitizeText(content);

  return (
    <Component
      className={cn(preserveWhitespace && "whitespace-pre-wrap", className)}
    >
      {sanitized}
    </Component>
  );
}

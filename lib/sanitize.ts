/**
 * XSS Sanitization Utilities
 * 
 * Uses DOMPurify to sanitize HTML/Markdown content before rendering
 * to prevent stored XSS attacks.
 */

import DOMPurify from "dompurify";

/**
 * Sanitize HTML content (removes dangerous scripts/tags)
 */
export function sanitizeHTML(html: string): string {
  if (typeof window === "undefined") {
    // Server-side: return as-is (will be sanitized on client)
    return html;
  }
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "code",
      "pre",
      "ul",
      "ol",
      "li",
      "blockquote",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
    ],
    ALLOWED_ATTR: ["href", "title"],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text (removes any HTML tags)
 */
export function sanitizeText(text: string): string {
  if (typeof window === "undefined") {
    return text;
  }
  
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize markdown-rendered content
 * Use this if you're using a markdown renderer that outputs HTML
 */
export function sanitizeMarkdown(html: string): string {
  if (typeof window === "undefined") {
    return html;
  }
  
  // More permissive for markdown, but still safe
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "code",
      "pre",
      "ul",
      "ol",
      "li",
      "blockquote",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "hr",
    ],
    ALLOWED_ATTR: ["href", "title", "align"],
    ALLOW_DATA_ATTR: false,
  });
}


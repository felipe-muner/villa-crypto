/**
 * String Utilities
 *
 * Common string manipulation functions for all projects
 */

/**
 * Sanitize a string by removing potentially dangerous characters
 * Useful for preventing XSS and cleaning user input
 *
 * @param str - String to sanitize
 * @param options - Sanitization options
 */
export function sanitize(
  str: string,
  options: {
    removeHtml?: boolean;
    removeScripts?: boolean;
    trim?: boolean;
    maxLength?: number;
  } = {}
): string {
  const {
    removeHtml = true,
    removeScripts = true,
    trim = true,
    maxLength,
  } = options;

  let result = str;

  // Remove script tags and their content first (most dangerous)
  if (removeScripts) {
    result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  }

  // Remove HTML tags
  if (removeHtml) {
    result = result.replace(/<[^>]*>/g, "");
  }

  // Decode HTML entities
  result = result
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Re-escape dangerous characters after decoding
  result = result
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Trim whitespace
  if (trim) {
    result = result.trim();
  }

  // Enforce max length
  if (maxLength && result.length > maxLength) {
    result = result.slice(0, maxLength);
  }

  return result;
}

/**
 * Escape HTML special characters to prevent XSS
 * Use this when displaying user-generated content
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalize the first letter of each word
 */
export function capitalizeWords(str: string): string {
  if (!str) return "";
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Convert string to title case (capitalize each word, lowercase the rest)
 */
export function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Truncate a string to a maximum length with ellipsis
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length including ellipsis
 * @param suffix - Suffix to add when truncated (default: "...")
 */
export function truncate(
  str: string,
  maxLength: number,
  suffix: string = "..."
): string {
  if (!str) return "";
  if (str.length <= maxLength) return str;

  const truncatedLength = maxLength - suffix.length;
  if (truncatedLength <= 0) return suffix.slice(0, maxLength);

  return str.slice(0, truncatedLength) + suffix;
}

/**
 * Truncate string at word boundary to avoid cutting words
 */
export function truncateWords(
  str: string,
  maxLength: number,
  suffix: string = "..."
): string {
  if (!str) return "";
  if (str.length <= maxLength) return str;

  const truncatedLength = maxLength - suffix.length;
  if (truncatedLength <= 0) return suffix.slice(0, maxLength);

  const truncated = str.slice(0, truncatedLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + suffix;
  }

  return truncated + suffix;
}

/**
 * Strip markdown formatting from a string
 * Useful for creating plain text previews
 */
export function stripMarkdown(str: string): string {
  if (!str) return "";

  let result = str;

  // Remove code blocks
  result = result.replace(/```[\s\S]*?```/g, "");
  result = result.replace(/`[^`]+`/g, "");

  // Remove headers
  result = result.replace(/^#{1,6}\s+/gm, "");

  // Remove emphasis (bold, italic, strikethrough)
  result = result.replace(/\*\*([^*]+)\*\*/g, "$1");
  result = result.replace(/\*([^*]+)\*/g, "$1");
  result = result.replace(/__([^_]+)__/g, "$1");
  result = result.replace(/_([^_]+)_/g, "$1");
  result = result.replace(/~~([^~]+)~~/g, "$1");

  // Remove links but keep text
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove images
  result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");

  // Remove blockquotes
  result = result.replace(/^>\s+/gm, "");

  // Remove horizontal rules
  result = result.replace(/^[-*_]{3,}\s*$/gm, "");

  // Remove list markers
  result = result.replace(/^[\s]*[-*+]\s+/gm, "");
  result = result.replace(/^[\s]*\d+\.\s+/gm, "");

  // Remove extra whitespace
  result = result.replace(/\n{3,}/g, "\n\n");
  result = result.trim();

  return result;
}

/**
 * Convert a string to a URL-friendly slug
 */
export function slugify(str: string): string {
  if (!str) return "";

  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove consecutive hyphens
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Convert a string to camelCase
 */
export function toCamelCase(str: string): string {
  if (!str) return "";

  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

/**
 * Convert a string to snake_case
 */
export function toSnakeCase(str: string): string {
  if (!str) return "";

  return str
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .replace(/_+/g, "_");
}

/**
 * Convert a string to kebab-case
 */
export function toKebabCase(str: string): string {
  if (!str) return "";

  return str
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/-+/g, "-");
}

/**
 * Remove extra whitespace from a string
 */
export function normalizeWhitespace(str: string): string {
  if (!str) return "";
  return str.replace(/\s+/g, " ").trim();
}

/**
 * Check if a string is empty or only whitespace
 */
export function isBlank(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Check if a string is NOT empty and NOT only whitespace
 */
export function isNotBlank(str: string | null | undefined): str is string {
  return !isBlank(str);
}

/**
 * Count words in a string
 */
export function wordCount(str: string): number {
  if (!str) return 0;
  const words = str.trim().split(/\s+/);
  return words[0] === "" ? 0 : words.length;
}

/**
 * Mask sensitive data (e.g., email, phone, credit card)
 */
export function mask(
  str: string,
  options: {
    visibleStart?: number;
    visibleEnd?: number;
    maskChar?: string;
  } = {}
): string {
  const { visibleStart = 2, visibleEnd = 2, maskChar = "*" } = options;

  if (!str || str.length <= visibleStart + visibleEnd) {
    return str;
  }

  const start = str.slice(0, visibleStart);
  const end = str.slice(-visibleEnd);
  const middleLength = str.length - visibleStart - visibleEnd;

  return start + maskChar.repeat(middleLength) + end;
}

/**
 * Mask an email address
 * john.doe@example.com -> jo***@example.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;

  const [localPart, domain] = email.split("@");
  const maskedLocal = mask(localPart, { visibleStart: 2, visibleEnd: 0 });

  return `${maskedLocal}@${domain}`;
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string, maxInitials: number = 2): string {
  if (!name) return "";

  const words = name.trim().split(/\s+/);
  const initials = words
    .slice(0, maxInitials)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials;
}

/**
 * Pluralize a word based on count
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  const pluralForm = plural || `${singular}s`;
  return count === 1 ? singular : pluralForm;
}

/**
 * Format a count with its label (e.g., "1 item", "5 items")
 */
export function formatCount(
  count: number,
  singular: string,
  plural?: string
): string {
  return `${count} ${pluralize(count, singular, plural)}`;
}

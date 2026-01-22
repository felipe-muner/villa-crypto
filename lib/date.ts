/**
 * Date Utilities
 *
 * This file re-exports from lib/utils/date.ts for backwards compatibility.
 * New code should import from "@/lib/utils" or "@/lib/utils/date".
 */

export * from "./utils/date";

// Re-export formatCurrency from format utils for backwards compatibility
export { formatCurrency } from "./utils/format";

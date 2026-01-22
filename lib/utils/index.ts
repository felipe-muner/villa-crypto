/**
 * Utils Library
 *
 * Centralized utilities for dates, strings, and formatting
 *
 * Usage:
 * import { toUTC, fromUTC, formatCurrency } from "@/lib/utils"
 *
 * Or import specific modules:
 * import * as dateUtils from "@/lib/utils/date"
 * import * as stringUtils from "@/lib/utils/string"
 * import * as formatUtils from "@/lib/utils/format"
 */

// Date utilities
export {
  // Timezone conversions
  toUTC,
  fromUTC,
  getUserTimezone,
  getBusinessTimezone,
  // Formatting
  formatForUser,
  formatDateTimeForUser,
  formatTimeForUser,
  formatDateRange,
  // Input handling
  fromDateInput,
  toDateInput,
  fromDateTimeInput,
  toDateTimeInput,
  // Date operations
  nowUTC,
  todayStartUTC,
  todayEndUTC,
  startOfDayUTC,
  endOfDayUTC,
  daysBetween,
  isDateInRange,
  doRangesOverlap,
  getDateRangePresets,
  getRelativeTime,
  // Date checks
  isToday,
  isPast,
  isFuture,
  // Backwards compatibility
  formatSimple,
  formatDate,
  parseDateRangePreset,
  toAPIDateString,
  fromAPIDateString,
  toInputDateValue,
  fromInputDateValue,
  startOfMonthUTC,
  endOfMonthUTC,
  startOfYearUTC,
  endOfYearUTC,
  // Re-exported from date-fns
  parseISO,
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subMonths,
  addDays,
  addMonths,
  isBefore,
  isAfter,
  isSameDay,
  isValid,
  differenceInDays,
  differenceInCalendarDays,
} from "./date";

// String utilities
export {
  sanitize,
  escapeHtml,
  capitalize,
  capitalizeWords,
  toTitleCase,
  truncate,
  truncateWords,
  stripMarkdown,
  slugify,
  toCamelCase,
  toSnakeCase,
  toKebabCase,
  normalizeWhitespace,
  isBlank,
  isNotBlank,
  wordCount,
  mask,
  maskEmail,
  getInitials,
  pluralize,
  formatCount,
} from "./string";

// Format utilities
export {
  formatCurrency,
  formatCurrencyCompact,
  formatCrypto,
  formatTime,
  formatMilliseconds,
  formatDuration,
  formatFileSize,
  parseFileSize,
  formatNumber,
  formatNumberCompact,
  formatPercentage,
  formatDecimalAsPercent,
  formatOrdinal,
  formatPhone,
  formatPhoneInternational,
  formatList,
  formatBandwidth,
  formatCreditCard,
  maskCreditCard,
  formatCoordinate,
  formatCoordinates,
} from "./format";

// Re-export the cn function from the original utils
export { cn } from "../utils";

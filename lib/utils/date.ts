/**
 * Date Utilities
 *
 * Best practices for global timezone handling:
 * - All dates are stored in UTC in the database
 * - Users select dates in their local timezone
 * - Display dates are converted to user's timezone
 * - Date comparisons and calculations use UTC
 *
 * Usage:
 * 1. User selects a date in their timezone -> toUTC() before saving to DB
 * 2. Reading from DB -> fromUTC() to display in user's timezone
 * 3. Query DB with date ranges -> always use UTC dates
 */

import {
  format,
  parseISO,
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
  isWithinInterval,
  differenceInDays,
  differenceInCalendarDays,
  isBefore,
  isAfter,
  isSameDay,
  isValid,
} from "date-fns";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

// Default business timezone
const DEFAULT_TIMEZONE = "America/Sao_Paulo";

/**
 * Get the business/default timezone
 * Override this in your app config if needed
 */
export function getBusinessTimezone(): string {
  return DEFAULT_TIMEZONE;
}

/**
 * Detect user's timezone from browser
 * Falls back to business timezone if not available
 */
export function getUserTimezone(): string {
  if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return getBusinessTimezone();
    }
  }
  return getBusinessTimezone();
}

/**
 * Convert a local date to UTC for database storage
 *
 * Use this when:
 * - User selects a date in a date picker
 * - Saving dates to the database
 *
 * @param date - Date in user's local timezone
 * @param timezone - User's timezone (auto-detected if not provided)
 */
export function toUTC(
  date: Date | string,
  timezone: string = getUserTimezone()
): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) {
    throw new Error("Invalid date provided to toUTC");
  }
  return fromZonedTime(d, timezone);
}

/**
 * Convert a UTC date from database to local timezone for display
 *
 * Use this when:
 * - Displaying dates from the database to users
 * - Showing dates in user's local time
 *
 * @param date - Date in UTC from database
 * @param timezone - User's timezone (auto-detected if not provided)
 */
export function fromUTC(
  date: Date | string,
  timezone: string = getUserTimezone()
): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) {
    throw new Error("Invalid date provided to fromUTC");
  }
  return toZonedTime(d, timezone);
}

/**
 * Format a UTC date for display in user's timezone
 *
 * Common format patterns:
 * - "MMM d, yyyy" -> "Jan 22, 2026"
 * - "MMMM d, yyyy" -> "January 22, 2026"
 * - "PP" -> "Jan 22, 2026" (localized)
 * - "PPP" -> "January 22nd, 2026"
 * - "PPp" -> "Jan 22, 2026, 3:30 PM"
 * - "yyyy-MM-dd" -> "2026-01-22"
 * - "HH:mm" -> "15:30"
 * - "h:mm a" -> "3:30 PM"
 *
 * @param date - UTC date from database
 * @param formatStr - date-fns format string
 * @param timezone - User's timezone (auto-detected if not provided)
 */
export function formatForUser(
  date: Date | string,
  formatStr: string = "MMM d, yyyy",
  timezone: string = getUserTimezone()
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) {
    return "Invalid date";
  }
  return formatInTimeZone(d, timezone, formatStr);
}

/**
 * Format date with time for user display
 */
export function formatDateTimeForUser(
  date: Date | string,
  timezone: string = getUserTimezone()
): string {
  return formatForUser(date, "MMM d, yyyy h:mm a", timezone);
}

/**
 * Format just the time for user display
 */
export function formatTimeForUser(
  date: Date | string,
  timezone: string = getUserTimezone()
): string {
  return formatForUser(date, "h:mm a", timezone);
}

/**
 * Get current date in UTC
 */
export function nowUTC(): Date {
  return new Date();
}

/**
 * Get today's date at start of day in user's timezone, converted to UTC
 * Useful for "today" queries
 */
export function todayStartUTC(timezone: string = getUserTimezone()): Date {
  const now = new Date();
  const localNow = toZonedTime(now, timezone);
  const localStart = startOfDay(localNow);
  return fromZonedTime(localStart, timezone);
}

/**
 * Get today's date at end of day in user's timezone, converted to UTC
 * Useful for "today" queries
 */
export function todayEndUTC(timezone: string = getUserTimezone()): Date {
  const now = new Date();
  const localNow = toZonedTime(now, timezone);
  const localEnd = endOfDay(localNow);
  return fromZonedTime(localEnd, timezone);
}

/**
 * Convert a date string from HTML date input to UTC
 * HTML date inputs return "YYYY-MM-DD" in local time
 */
export function fromDateInput(
  dateStr: string,
  timezone: string = getUserTimezone()
): Date {
  const localDate = parseISO(dateStr);
  return fromZonedTime(localDate, timezone);
}

/**
 * Convert a UTC date to HTML date input format (YYYY-MM-DD)
 */
export function toDateInput(
  date: Date | string,
  timezone: string = getUserTimezone()
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(d, timezone, "yyyy-MM-dd");
}

/**
 * Convert a datetime-local input value to UTC
 * HTML datetime-local inputs return "YYYY-MM-DDTHH:mm" in local time
 */
export function fromDateTimeInput(
  datetimeStr: string,
  timezone: string = getUserTimezone()
): Date {
  const localDate = parseISO(datetimeStr);
  return fromZonedTime(localDate, timezone);
}

/**
 * Convert a UTC date to datetime-local input format
 */
export function toDateTimeInput(
  date: Date | string,
  timezone: string = getUserTimezone()
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(d, timezone, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Get start of day in UTC (for a given UTC date)
 */
export function startOfDayUTC(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return startOfDay(d);
}

/**
 * Get end of day in UTC (for a given UTC date)
 */
export function endOfDayUTC(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return endOfDay(d);
}

/**
 * Calculate difference in days between two dates
 */
export function daysBetween(start: Date | string, end: Date | string): number {
  const startDate = typeof start === "string" ? parseISO(start) : start;
  const endDate = typeof end === "string" ? parseISO(end) : end;
  return differenceInCalendarDays(endDate, startDate);
}

/**
 * Check if a date is within a range (inclusive)
 */
export function isDateInRange(
  date: Date | string,
  start: Date | string,
  end: Date | string
): boolean {
  const d = typeof date === "string" ? parseISO(date) : date;
  const s = typeof start === "string" ? parseISO(start) : start;
  const e = typeof end === "string" ? parseISO(end) : end;
  return isWithinInterval(d, { start: s, end: e });
}

/**
 * Check if two date ranges overlap
 */
export function doRangesOverlap(
  range1Start: Date | string,
  range1End: Date | string,
  range2Start: Date | string,
  range2End: Date | string
): boolean {
  const r1s = typeof range1Start === "string" ? parseISO(range1Start) : range1Start;
  const r1e = typeof range1End === "string" ? parseISO(range1End) : range1End;
  const r2s = typeof range2Start === "string" ? parseISO(range2Start) : range2Start;
  const r2e = typeof range2End === "string" ? parseISO(range2End) : range2End;

  return isBefore(r1s, r2e) && isAfter(r1e, r2s);
}

/**
 * Format a date range for display
 */
export function formatDateRange(
  start: Date | string,
  end: Date | string,
  timezone: string = getUserTimezone()
): string {
  const startStr = formatForUser(start, "MMM d", timezone);
  const endStr = formatForUser(end, "MMM d, yyyy", timezone);
  return `${startStr} - ${endStr}`;
}

/**
 * Get predefined date ranges for filters
 */
export function getDateRangePresets(
  timezone: string = getUserTimezone()
): Array<{
  label: string;
  value: string;
  start: Date;
  end: Date;
}> {
  const now = nowUTC();

  return [
    {
      label: "Today",
      value: "today",
      start: todayStartUTC(timezone),
      end: todayEndUTC(timezone),
    },
    {
      label: "Last 7 days",
      value: "last7days",
      start: startOfDayUTC(subDays(now, 6)),
      end: endOfDayUTC(now),
    },
    {
      label: "Last 30 days",
      value: "last30days",
      start: startOfDayUTC(subDays(now, 29)),
      end: endOfDayUTC(now),
    },
    {
      label: "This month",
      value: "thisMonth",
      start: startOfMonth(now),
      end: endOfMonth(now),
    },
    {
      label: "Last month",
      value: "lastMonth",
      start: startOfMonth(subMonths(now, 1)),
      end: endOfMonth(subMonths(now, 1)),
    },
    {
      label: "This year",
      value: "thisYear",
      start: startOfYear(now),
      end: endOfYear(now),
    },
  ];
}

/**
 * Get relative time description (e.g., "2 days ago", "in 3 hours")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (Math.abs(diffMinutes) < 1) {
    return "just now";
  }

  if (Math.abs(diffMinutes) < 60) {
    return diffMinutes > 0
      ? `in ${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`
      : `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) !== 1 ? "s" : ""} ago`;
  }

  if (Math.abs(diffHours) < 24) {
    return diffHours > 0
      ? `in ${diffHours} hour${diffHours !== 1 ? "s" : ""}`
      : `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? "s" : ""} ago`;
  }

  if (Math.abs(diffDays) < 30) {
    return diffDays > 0
      ? `in ${diffDays} day${diffDays !== 1 ? "s" : ""}`
      : `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""} ago`;
  }

  const diffMonths = Math.round(diffDays / 30);
  return diffMonths > 0
    ? `in ${diffMonths} month${diffMonths !== 1 ? "s" : ""}`
    : `${Math.abs(diffMonths)} month${Math.abs(diffMonths) !== 1 ? "s" : ""} ago`;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string, timezone: string = getUserTimezone()): boolean {
  const d = typeof date === "string" ? parseISO(date) : date;
  const localDate = toZonedTime(d, timezone);
  const localNow = toZonedTime(new Date(), timezone);
  return isSameDay(localDate, localNow);
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === "string" ? parseISO(date) : date;
  return isBefore(d, new Date());
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date | string): boolean {
  const d = typeof date === "string" ? parseISO(date) : date;
  return isAfter(d, new Date());
}

// ============================================
// BACKWARDS COMPATIBILITY FUNCTIONS
// These are kept for compatibility with existing code
// New code should use the newer function names
// ============================================

/**
 * Format a date for display (simple format without timezone conversion)
 * Use for dates that are already in the correct timezone
 * @deprecated Use formatForUser instead
 */
export function formatSimple(date: Date | string, formatStr: string = "MMM d, yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, formatStr);
}

/**
 * Format a UTC date for display in a specific timezone
 * @deprecated Use formatForUser instead
 */
export function formatDate(
  date: Date | string,
  formatStr: string = "MMM d, yyyy",
  timezone: string = DEFAULT_TIMEZONE
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(d, timezone, formatStr);
}

/**
 * Parse date range from query string preset
 */
export function parseDateRangePreset(preset: string): { start: Date; end: Date } | null {
  const presets = getDateRangePresets();
  const found = presets.find((p) => p.value === preset);
  return found ? { start: found.start, end: found.end } : null;
}

/**
 * Format date for API query parameter (ISO string)
 */
export function toAPIDateString(date: Date): string {
  return date.toISOString();
}

/**
 * Parse date from API query parameter
 */
export function fromAPIDateString(dateStr: string): Date {
  return parseISO(dateStr);
}

/**
 * Format date for input[type="date"] value (YYYY-MM-DD)
 * @deprecated Use toDateInput instead
 */
export function toInputDateValue(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

/**
 * Parse date from input[type="date"] value
 * @deprecated Use fromDateInput instead
 */
export function fromInputDateValue(dateStr: string): Date {
  return parseISO(dateStr);
}

/**
 * Get start of month in UTC
 */
export function startOfMonthUTC(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return startOfMonth(d);
}

/**
 * Get end of month in UTC
 */
export function endOfMonthUTC(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return endOfMonth(d);
}

/**
 * Get start of year in UTC
 */
export function startOfYearUTC(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return startOfYear(d);
}

/**
 * Get end of year in UTC
 */
export function endOfYearUTC(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return endOfYear(d);
}

// Re-export commonly used date-fns functions
export {
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
};

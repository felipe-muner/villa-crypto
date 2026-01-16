/**
 * Global Date Utility Library
 *
 * Best practices:
 * - All dates are stored in UTC in the database
 * - Display dates are converted to user's timezone
 * - Date comparisons and calculations use UTC
 * - Use date-fns for all date operations
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
} from "date-fns";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

// Default timezone for display (can be overridden per user)
const DEFAULT_TIMEZONE = "America/Sao_Paulo";

/**
 * Convert a Date to UTC for database storage
 * Use this when saving dates to the database
 */
export function toUTC(date: Date | string, timezone: string = DEFAULT_TIMEZONE): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return fromZonedTime(d, timezone);
}

/**
 * Convert a UTC date from database to local timezone for display
 * Use this when displaying dates to users
 */
export function fromUTC(date: Date | string, timezone: string = DEFAULT_TIMEZONE): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return toZonedTime(d, timezone);
}

/**
 * Format a UTC date for display in a specific timezone
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
 * Format a date for display (simple format without timezone conversion)
 * Use for dates that are already in the correct timezone
 */
export function formatSimple(date: Date | string, formatStr: string = "MMM d, yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, formatStr);
}

/**
 * Get current date in UTC
 */
export function nowUTC(): Date {
  return new Date();
}

/**
 * Get start of day in UTC
 */
export function startOfDayUTC(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return startOfDay(d);
}

/**
 * Get end of day in UTC
 */
export function endOfDayUTC(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return endOfDay(d);
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
 * Get predefined date ranges for filters
 */
export function getDateRangePresets(): Array<{
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
      start: startOfDayUTC(now),
      end: endOfDayUTC(now),
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
      start: startOfMonthUTC(now),
      end: endOfMonthUTC(now),
    },
    {
      label: "Last month",
      value: "lastMonth",
      start: startOfMonthUTC(subMonths(now, 1)),
      end: endOfMonthUTC(subMonths(now, 1)),
    },
    {
      label: "This year",
      value: "thisYear",
      start: startOfYearUTC(now),
      end: endOfYearUTC(now),
    },
  ];
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
 */
export function toInputDateValue(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

/**
 * Parse date from input[type="date"] value
 */
export function fromInputDateValue(dateStr: string): Date {
  return parseISO(dateStr);
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date range for display
 */
export function formatDateRange(
  start: Date | string,
  end: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const startStr = formatDate(start, "MMM d", timezone);
  const endStr = formatDate(end, "MMM d, yyyy", timezone);
  return `${startStr} - ${endStr}`;
}

// Re-export commonly used date-fns functions for convenience
export {
  parseISO,
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  addDays,
  addMonths,
  isBefore,
  isAfter,
  isSameDay,
  differenceInDays,
  differenceInCalendarDays,
};

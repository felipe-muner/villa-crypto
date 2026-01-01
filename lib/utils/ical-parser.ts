import ical, { VEvent } from "node-ical";
import { isAfter, isBefore, parseISO } from "date-fns";
import { BookedPeriod } from "@/lib/types/villa";

export async function fetchAndParseIcal(
  calendarUrl: string
): Promise<BookedPeriod[]> {
  try {
    const events = await ical.async.fromURL(calendarUrl);
    const bookedPeriods: BookedPeriod[] = [];

    for (const key in events) {
      const event = events[key];

      if (event.type === "VEVENT") {
        const vevent = event as VEvent;

        if (vevent.start && vevent.end) {
          bookedPeriods.push({
            start: new Date(vevent.start),
            end: new Date(vevent.end),
            summary: vevent.summary || "Booked",
          });
        }
      }
    }

    return bookedPeriods;
  } catch (error) {
    console.error("Error fetching/parsing iCal:", error);
    throw new Error(
      `Failed to fetch calendar: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export function isDateAvailable(
  date: Date,
  bookedPeriods: BookedPeriod[]
): boolean {
  for (const period of bookedPeriods) {
    const periodStart = new Date(period.start);
    const periodEnd = new Date(period.end);

    // Check if date falls within the booked period
    if (
      (isAfter(date, periodStart) || date.getTime() === periodStart.getTime()) &&
      isBefore(date, periodEnd)
    ) {
      return false;
    }
  }
  return true;
}

export function getAvailabilityForDateRange(
  startDate: Date,
  endDate: Date,
  bookedPeriods: BookedPeriod[]
): { date: Date; isAvailable: boolean }[] {
  const availability: { date: Date; isAvailable: boolean }[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    availability.push({
      date: new Date(currentDate),
      isAvailable: isDateAvailable(currentDate, bookedPeriods),
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availability;
}

export function mergeBookedPeriods(
  airbnbPeriods: BookedPeriod[],
  bookingPeriods: BookedPeriod[]
): BookedPeriod[] {
  // Combine all periods and sort by start date
  const allPeriods = [...airbnbPeriods, ...bookingPeriods].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  if (allPeriods.length === 0) return [];

  // Merge overlapping periods
  const merged: BookedPeriod[] = [allPeriods[0]];

  for (let i = 1; i < allPeriods.length; i++) {
    const current = allPeriods[i];
    const last = merged[merged.length - 1];

    const lastEnd = new Date(last.end);
    const currentStart = new Date(current.start);

    if (currentStart <= lastEnd) {
      // Overlapping, merge
      const currentEnd = new Date(current.end);
      if (currentEnd > lastEnd) {
        last.end = current.end;
      }
    } else {
      // No overlap, add new period
      merged.push(current);
    }
  }

  return merged;
}

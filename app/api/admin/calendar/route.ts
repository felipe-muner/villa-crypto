import { NextRequest, NextResponse } from "next/server";
import { db, villas, bookings } from "@/lib/db";
import { eq, and, or, lte, gte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  parseISO,
} from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month") || format(new Date(), "yyyy-MM");

    // Parse month
    const monthDate = parseISO(`${monthParam}-01`);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    // Get all active villas
    const allVillas = await db
      .select()
      .from(villas)
      .where(eq(villas.isActive, true));

    // Get all bookings that overlap with this month
    const monthBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          or(
            eq(bookings.status, "pending"),
            eq(bookings.status, "paid"),
            eq(bookings.status, "confirmed")
          ),
          lte(bookings.checkIn, monthEnd),
          gte(bookings.checkOut, monthStart)
        )
      );

    // Generate all days in the month
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Build the calendar data
    const calendarData = {
      month: monthParam,
      monthLabel: format(monthDate, "MMMM yyyy"),
      villas: allVillas.map((villa) => ({
        id: villa.id,
        name: villa.name,
      })),
      days: days.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const dayOfMonth = day.getDate();
        const dayOfWeek = format(day, "EEE");

        // Check availability for each villa on this day
        const villaAvailability: Record<string, { available: boolean; bookingId?: string; status?: string }> = {};

        for (const villa of allVillas) {
          const booking = monthBookings.find((b) => {
            if (b.villaId !== villa.id) return false;
            const checkIn = new Date(b.checkIn);
            const checkOut = new Date(b.checkOut);
            // Day is booked if it's >= checkIn and < checkOut
            return day >= checkIn && day < checkOut;
          });

          villaAvailability[villa.id] = booking
            ? { available: false, bookingId: booking.id, status: booking.status }
            : { available: true };
        }

        return {
          date: dateStr,
          dayOfMonth,
          dayOfWeek,
          villaAvailability,
        };
      }),
    };

    return NextResponse.json(calendarData);
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar data" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db, bookings, villas, blockedDates } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and, or, gte, lte } from "drizzle-orm";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  parseISO,
} from "date-fns";

type RouteParams = { params: Promise<{ id: string }> };

interface DayAvailability {
  date: string;
  dayOfMonth: number;
  dayOfWeek: string;
  available: boolean;
  bookingId?: string;
  bookingStatus?: string;
  blockedId?: string;
  blockedReason?: string;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: villaId } = await params;
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month"); // Format: "2026-01"

    // Check if villa exists
    const [villa] = await db
      .select()
      .from(villas)
      .where(eq(villas.id, villaId))
      .limit(1);

    if (!villa) {
      return NextResponse.json({ error: "Villa not found" }, { status: 404 });
    }

    // Only admins or villa owners can view availability
    const isAdmin = session.user.role === "admin";
    const isOwner = villa.ownerEmail === session.user.email;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse the month or default to current month
    let targetDate: Date;
    if (monthParam) {
      targetDate = parseISO(`${monthParam}-01`);
    } else {
      targetDate = new Date();
    }

    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    // Get all bookings for this villa that overlap with the requested month
    // A booking overlaps if: checkIn <= monthEnd AND checkOut >= monthStart
    const villaBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.villaId, villaId),
          or(
            eq(bookings.status, "pending"),
            eq(bookings.status, "paid"),
            eq(bookings.status, "confirmed")
          ),
          lte(bookings.checkIn, monthEnd),
          gte(bookings.checkOut, monthStart)
        )
      );

    // Get all blocked dates for this villa that overlap with the requested month
    const villaBlockedDates = await db
      .select()
      .from(blockedDates)
      .where(
        and(
          eq(blockedDates.villaId, villaId),
          lte(blockedDates.startDate, monthEnd),
          gte(blockedDates.endDate, monthStart)
        )
      );

    // Generate all days in the month
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Map each day to availability status
    const days: DayAvailability[] = daysInMonth.map((day) => {
      // Check if this day falls within any booking
      const booking = villaBookings.find((b) => {
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        // A day is booked if it's >= checkIn and < checkOut (checkout day is available)
        return day >= checkIn && day < checkOut;
      });

      // Check if this day falls within any blocked period
      const blocked = villaBlockedDates.find((b) => {
        const start = new Date(b.startDate);
        const end = new Date(b.endDate);
        return day >= start && day <= end;
      });

      return {
        date: format(day, "yyyy-MM-dd"),
        dayOfMonth: day.getDate(),
        dayOfWeek: format(day, "EEE"),
        available: !booking && !blocked,
        bookingId: booking?.id,
        bookingStatus: booking?.status,
        blockedId: blocked?.id,
        blockedReason: blocked?.reason || undefined,
      };
    });

    const bookedDays = days.filter((d) => d.bookingId).length;
    const blockedDays = days.filter((d) => d.blockedId && !d.bookingId).length;

    return NextResponse.json({
      villaId,
      villaName: villa.name,
      month: format(monthStart, "yyyy-MM"),
      monthLabel: format(monthStart, "MMMM yyyy"),
      days,
      totalDays: days.length,
      availableDays: days.filter((d) => d.available).length,
      bookedDays,
      blockedDays,
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

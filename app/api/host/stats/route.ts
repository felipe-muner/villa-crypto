import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, villas, bookings } from "@/lib/db";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import {
  fromAPIDateString,
  startOfDayUTC,
  endOfDayUTC,
  parseDateRangePreset,
  startOfMonthUTC,
  nowUTC,
} from "@/lib/date";
import type { BookingStatus } from "@/lib/types/database";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.isHost) {
      return NextResponse.json({ error: "Not a host" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const preset = searchParams.get("preset");

    // Determine date range
    let startDate: Date;
    let endDate: Date;

    if (preset) {
      const presetRange = parseDateRangePreset(preset);
      if (presetRange) {
        startDate = presetRange.start;
        endDate = presetRange.end;
      } else {
        // Default to this month
        startDate = startOfMonthUTC(nowUTC());
        endDate = endOfDayUTC(nowUTC());
      }
    } else if (startParam && endParam) {
      startDate = startOfDayUTC(fromAPIDateString(startParam));
      endDate = endOfDayUTC(fromAPIDateString(endParam));
    } else {
      // Default to this month
      startDate = startOfMonthUTC(nowUTC());
      endDate = endOfDayUTC(nowUTC());
    }

    // Get host's villas
    const hostVillas = await db
      .select()
      .from(villas)
      .where(eq(villas.ownerEmail, session.user.email));

    if (hostVillas.length === 0) {
      return NextResponse.json({
        totalRevenue: 0,
        totalBookings: 0,
        confirmedBookings: 0,
        pendingBookings: 0,
        avgBookingValue: 0,
        villaStats: [],
        recentBookings: [],
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      });
    }

    const villaIds = hostVillas.map((v) => v.id);

    // Statuses that count as "revenue generating"
    const revenueStatuses: BookingStatus[] = ["paid", "confirmed", "completed"];

    // Get all bookings in date range for host's villas
    const hostBookings = await db
      .select({
        booking: bookings,
        villa: villas,
      })
      .from(bookings)
      .leftJoin(villas, eq(bookings.villaId, villas.id))
      .where(
        and(
          inArray(bookings.villaId, villaIds),
          gte(bookings.createdAt, startDate),
          lte(bookings.createdAt, endDate)
        )
      );

    // Calculate stats
    const revenueBookings = hostBookings.filter((b) =>
      revenueStatuses.includes(b.booking.status as BookingStatus)
    );

    const totalRevenue = revenueBookings.reduce(
      (sum, b) => sum + Number(b.booking.totalPrice),
      0
    );

    const totalBookings = hostBookings.length;
    const confirmedBookings = hostBookings.filter(
      (b) => b.booking.status === "confirmed" || b.booking.status === "completed"
    ).length;
    const pendingBookings = hostBookings.filter(
      (b) => b.booking.status === "pending" || b.booking.status === "paid"
    ).length;

    const avgBookingValue = revenueBookings.length > 0
      ? totalRevenue / revenueBookings.length
      : 0;

    // Calculate per-villa stats
    const villaStatsMap = new Map<
      string,
      {
        villaId: string;
        villaName: string;
        revenue: number;
        bookings: number;
        confirmedBookings: number;
        pendingBookings: number;
      }
    >();

    // Initialize all villas
    for (const villa of hostVillas) {
      villaStatsMap.set(villa.id, {
        villaId: villa.id,
        villaName: villa.name,
        revenue: 0,
        bookings: 0,
        confirmedBookings: 0,
        pendingBookings: 0,
      });
    }

    // Populate stats from bookings
    for (const { booking, villa } of hostBookings) {
      if (!villa) continue;

      const stats = villaStatsMap.get(villa.id);
      if (!stats) continue;

      stats.bookings += 1;

      if (revenueStatuses.includes(booking.status as BookingStatus)) {
        stats.revenue += Number(booking.totalPrice);
      }

      if (booking.status === "confirmed" || booking.status === "completed") {
        stats.confirmedBookings += 1;
      } else if (booking.status === "pending" || booking.status === "paid") {
        stats.pendingBookings += 1;
      }
    }

    const villaStats = Array.from(villaStatsMap.values()).sort(
      (a, b) => b.revenue - a.revenue
    );

    // Get recent bookings (last 5)
    const recentBookings = hostBookings
      .sort(
        (a, b) =>
          new Date(b.booking.createdAt).getTime() -
          new Date(a.booking.createdAt).getTime()
      )
      .slice(0, 5)
      .map(({ booking, villa }) => ({
        id: booking.id,
        villaName: villa?.name || "Unknown",
        guestEmail: booking.userEmail,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        totalPrice: Number(booking.totalPrice),
        status: booking.status,
        createdAt: booking.createdAt,
      }));

    return NextResponse.json({
      totalRevenue,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      avgBookingValue,
      villaStats,
      recentBookings,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching host stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

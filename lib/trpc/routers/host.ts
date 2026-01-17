import { TRPCError } from "@trpc/server";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { router, hostProcedure } from "../init";
import { hostStatsQuerySchema } from "../schemas";
import { villas, bookings } from "@/lib/db/schema";
import {
  fromAPIDateString,
  startOfDayUTC,
  endOfDayUTC,
  parseDateRangePreset,
  startOfMonthUTC,
  nowUTC,
} from "@/lib/date";
import type { BookingStatus } from "@/lib/types/database";

export const hostRouter = router({
  // Get host stats
  stats: hostProcedure
    .input(hostStatsQuerySchema.optional())
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.isHost) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not a host",
        });
      }

      // Determine date range
      let startDate: Date;
      let endDate: Date;

      if (input?.preset) {
        const presetRange = parseDateRangePreset(input.preset);
        if (presetRange) {
          startDate = presetRange.start;
          endDate = presetRange.end;
        } else {
          startDate = startOfMonthUTC(nowUTC());
          endDate = endOfDayUTC(nowUTC());
        }
      } else if (input?.startDate && input?.endDate) {
        startDate = startOfDayUTC(fromAPIDateString(input.startDate));
        endDate = endOfDayUTC(fromAPIDateString(input.endDate));
      } else {
        startDate = startOfMonthUTC(nowUTC());
        endDate = endOfDayUTC(nowUTC());
      }

      // Get host's villas
      const hostVillas = await ctx.db
        .select()
        .from(villas)
        .where(eq(villas.ownerEmail, ctx.session.user.email));

      if (hostVillas.length === 0) {
        return {
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
        };
      }

      const villaIds = hostVillas.map((v) => v.id);

      // Statuses that count as "revenue generating"
      const revenueStatuses: BookingStatus[] = ["paid", "confirmed", "completed"];

      // Get all bookings in date range for host's villas
      const hostBookings = await ctx.db
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

      const avgBookingValue =
        revenueBookings.length > 0 ? totalRevenue / revenueBookings.length : 0;

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

      return {
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
      };
    }),
});

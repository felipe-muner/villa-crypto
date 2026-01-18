import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, gte, lte, inArray, or, desc } from "drizzle-orm";
import { router, hostProcedure } from "../init";
import { hostStatsQuerySchema } from "../schemas";
import { villas, bookings, blockedDates, users } from "@/lib/db/schema";
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

  // Blocked dates management
  blockedDates: router({
    // List blocked dates for a villa
    list: hostProcedure
      .input(z.object({
        villaId: z.string().uuid(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        // Verify ownership
        const [villa] = await ctx.db
          .select()
          .from(villas)
          .where(eq(villas.id, input.villaId))
          .limit(1);

        if (!villa) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Villa not found",
          });
        }

        const isAdmin = ctx.session.user.role === "admin";
        const isOwner = villa.ownerEmail === ctx.session.user.email;

        if (!isAdmin && !isOwner) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only manage your own villas",
          });
        }

        // Build query conditions
        const conditions = [eq(blockedDates.villaId, input.villaId)];

        if (input.startDate) {
          conditions.push(gte(blockedDates.endDate, startOfDayUTC(fromAPIDateString(input.startDate))));
        }
        if (input.endDate) {
          conditions.push(lte(blockedDates.startDate, endOfDayUTC(fromAPIDateString(input.endDate))));
        }

        const blocked = await ctx.db
          .select()
          .from(blockedDates)
          .where(and(...conditions))
          .orderBy(desc(blockedDates.startDate));

        return blocked;
      }),

    // Add blocked dates
    add: hostProcedure
      .input(z.object({
        villaId: z.string().uuid(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const [villa] = await ctx.db
          .select()
          .from(villas)
          .where(eq(villas.id, input.villaId))
          .limit(1);

        if (!villa) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Villa not found",
          });
        }

        const isAdmin = ctx.session.user.role === "admin";
        const isOwner = villa.ownerEmail === ctx.session.user.email;

        if (!isAdmin && !isOwner) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only manage your own villas",
          });
        }

        const start = startOfDayUTC(fromAPIDateString(input.startDate));
        const end = endOfDayUTC(fromAPIDateString(input.endDate));

        if (start > end) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Start date must be before end date",
          });
        }

        // Check for existing bookings in this range
        const existingBookings = await ctx.db
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.villaId, input.villaId),
              or(
                eq(bookings.status, "pending"),
                eq(bookings.status, "paid"),
                eq(bookings.status, "confirmed")
              ),
              // Booking overlaps with the range
              lte(bookings.checkIn, end),
              gte(bookings.checkOut, start)
            )
          );

        if (existingBookings.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Cannot block dates that have existing bookings",
          });
        }

        // Create blocked date entry
        const [blocked] = await ctx.db
          .insert(blockedDates)
          .values({
            villaId: input.villaId,
            startDate: start,
            endDate: end,
            reason: input.reason,
            createdBy: ctx.session.user.email,
          })
          .returning();

        return blocked;
      }),

    // Remove blocked dates
    remove: hostProcedure
      .input(z.object({
        id: z.string().uuid(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get the blocked date entry
        const [blocked] = await ctx.db
          .select()
          .from(blockedDates)
          .where(eq(blockedDates.id, input.id))
          .limit(1);

        if (!blocked) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Blocked date not found",
          });
        }

        // Verify ownership
        const [villa] = await ctx.db
          .select()
          .from(villas)
          .where(eq(villas.id, blocked.villaId))
          .limit(1);

        if (!villa) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Villa not found",
          });
        }

        const isAdmin = ctx.session.user.role === "admin";
        const isOwner = villa.ownerEmail === ctx.session.user.email;

        if (!isAdmin && !isOwner) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only manage your own villas",
          });
        }

        await ctx.db
          .delete(blockedDates)
          .where(eq(blockedDates.id, input.id));

        return { success: true };
      }),
  }),

  // Settings management
  settings: router({
    // Get current host settings (wallet addresses)
    get: hostProcedure.query(async ({ ctx }) => {
      const [user] = await ctx.db
        .select({
          btcAddress: users.btcAddress,
          ethAddress: users.ethAddress,
          usdtEthAddress: users.usdtEthAddress,
          usdtBscAddress: users.usdtBscAddress,
        })
        .from(users)
        .where(eq(users.email, ctx.session.user.email))
        .limit(1);

      return {
        btcAddress: user?.btcAddress || "",
        ethAddress: user?.ethAddress || "",
        usdtEthAddress: user?.usdtEthAddress || "",
        usdtBscAddress: user?.usdtBscAddress || "",
      };
    }),

    // Update wallet addresses
    updateWallets: hostProcedure
      .input(z.object({
        btcAddress: z.string().optional(),
        ethAddress: z.string().optional(),
        usdtEthAddress: z.string().optional(),
        usdtBscAddress: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const [updated] = await ctx.db
          .update(users)
          .set({
            btcAddress: input.btcAddress || null,
            ethAddress: input.ethAddress || null,
            usdtEthAddress: input.usdtEthAddress || null,
            usdtBscAddress: input.usdtBscAddress || null,
            updatedAt: new Date(),
          })
          .where(eq(users.email, ctx.session.user.email))
          .returning();

        return {
          btcAddress: updated.btcAddress || "",
          ethAddress: updated.ethAddress || "",
          usdtEthAddress: updated.usdtEthAddress || "",
          usdtBscAddress: updated.usdtBscAddress || "",
        };
      }),
  }),
});

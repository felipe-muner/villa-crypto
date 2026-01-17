import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, or, gte, lte, desc } from "drizzle-orm";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  parseISO,
  addDays,
} from "date-fns";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { router, adminProcedure } from "../init";
import { updateWalletSchema, createInvitationSchema, calendarQuerySchema } from "../schemas";
import { walletConfig, hostInvitations, users, villas, bookings } from "@/lib/db/schema";

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
};

export const adminRouter = router({
  // Wallet config
  wallet: router({
    get: adminProcedure.query(async ({ ctx }) => {
      const [config] = await ctx.db
        .select()
        .from(walletConfig)
        .where(eq(walletConfig.id, 1))
        .limit(1);

      if (!config) {
        return {
          btcAddress: null,
          ethAddress: null,
          usdtEthAddress: null,
          usdtBscAddress: null,
        };
      }

      return {
        btcAddress: config.btcAddress,
        ethAddress: config.ethAddress,
        usdtEthAddress: config.usdtEthAddress,
        usdtBscAddress: config.usdtBscAddress,
      };
    }),

    update: adminProcedure
      .input(updateWalletSchema)
      .mutation(async ({ ctx, input }) => {
        const [existingConfig] = await ctx.db
          .select()
          .from(walletConfig)
          .where(eq(walletConfig.id, 1))
          .limit(1);

        if (existingConfig) {
          await ctx.db
            .update(walletConfig)
            .set({
              btcAddress: input.btcAddress || null,
              ethAddress: input.ethAddress || null,
              usdtEthAddress: input.usdtEthAddress || null,
              usdtBscAddress: input.usdtBscAddress || null,
              updatedAt: new Date(),
              updatedBy: ctx.session.user.email,
            })
            .where(eq(walletConfig.id, 1));
        } else {
          await ctx.db.insert(walletConfig).values({
            id: 1,
            btcAddress: input.btcAddress || null,
            ethAddress: input.ethAddress || null,
            usdtEthAddress: input.usdtEthAddress || null,
            usdtBscAddress: input.usdtBscAddress || null,
            updatedBy: ctx.session.user.email,
          });
        }

        return { success: true };
      }),
  }),

  // Calendar
  calendar: adminProcedure
    .input(calendarQuerySchema.optional())
    .query(async ({ ctx, input }) => {
      const monthParam = input?.month || format(new Date(), "yyyy-MM");
      const monthDate = parseISO(`${monthParam}-01`);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      // Get all active villas
      const allVillas = await ctx.db
        .select()
        .from(villas)
        .where(eq(villas.isActive, true));

      // Get all bookings that overlap with this month
      const monthBookings = await ctx.db
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

      // Build calendar data
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

          const villaAvailability: Record<
            string,
            { available: boolean; bookingId?: string; status?: string }
          > = {};

          for (const villa of allVillas) {
            const booking = monthBookings.find((b) => {
              if (b.villaId !== villa.id) return false;
              const checkIn = new Date(b.checkIn);
              const checkOut = new Date(b.checkOut);
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

      return calendarData;
    }),

  // Invitations
  invitations: router({
    list: adminProcedure.query(async ({ ctx }) => {
      return ctx.db
        .select()
        .from(hostInvitations)
        .orderBy(desc(hostInvitations.createdAt));
    }),

    create: adminProcedure
      .input(createInvitationSchema)
      .mutation(async ({ ctx, input }) => {
        // Check if invitation already exists
        const [existing] = await ctx.db
          .select()
          .from(hostInvitations)
          .where(eq(hostInvitations.email, input.email))
          .limit(1);

        if (existing && existing.status === "accepted") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This email is already a host",
          });
        }

        if (existing && existing.status === "pending") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Invitation already sent to this email",
          });
        }

        // Check if user already exists and is a host
        const [existingUser] = await ctx.db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (existingUser?.isHost) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This user is already a host",
          });
        }

        // Generate unique token
        const token = randomBytes(32).toString("hex");
        const expiresAt = addDays(new Date(), 7);

        // Create invitation
        const [invitation] = await ctx.db
          .insert(hostInvitations)
          .values({
            email: input.email,
            invitedBy: ctx.session.user.email,
            token,
            expiresAt,
          })
          .returning();

        // Send invitation email
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const inviteUrl = `${baseUrl}/invite/${token}`;

        try {
          const resend = getResendClient();
          await resend.emails.send({
            from: "Villa Crypto <onboarding@resend.dev>",
            to: input.email,
            subject: "You're invited to become a Host on Villa Crypto",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <title>Host Invitation</title>
              </head>
              <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                  <h1 style="color: white; margin: 0;">🏠 Villa Crypto</h1>
                  <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Host Invitation</p>
                </div>

                <h2>Hello${input.name ? ` ${input.name}` : ""}!</h2>

                <p>You&apos;ve been invited to become a <strong>Host</strong> on Villa Crypto - a platform for listing and renting villas with cryptocurrency payments.</p>

                <p>As a host, you can:</p>
                <ul>
                  <li>List your villas on the platform</li>
                  <li>Accept crypto payments (BTC, ETH, USDT)</li>
                  <li>Manage bookings and guests</li>
                  <li>Track your earnings</li>
                </ul>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${inviteUrl}" style="background: #667eea; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                    Accept Invitation
                  </a>
                </div>

                <p style="color: #666; font-size: 14px;">
                  This invitation expires in 7 days. If you didn&apos;t expect this email, you can safely ignore it.
                </p>

                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

                <p style="color: #999; font-size: 12px; text-align: center;">
                  Villa Crypto - Rent Villas with Crypto
                </p>
              </body>
              </html>
            `,
          });
        } catch (emailError) {
          console.error("Failed to send invitation email:", emailError);
          // Don't fail the request, invitation is created
        }

        return invitation;
      }),
  }),
});

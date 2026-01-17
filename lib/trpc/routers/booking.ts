import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, or, gte, lte, desc, ne, isNotNull } from "drizzle-orm";
import { differenceInDays } from "date-fns";
import { router, protectedProcedure } from "../init";
import { createBookingSchema, updateBookingSchema, bookingQuerySchema } from "../schemas";
import { bookings, villas, users, walletConfig } from "@/lib/db/schema";
import { convertUsdToCrypto, getCryptoDecimals } from "@/lib/crypto/prices";
import { sendBookingConfirmationEmail, sendPaymentReceivedEmail, sendBookingConfirmedEmail } from "@/lib/email";
import { verifyTransaction as verifyTransactionUsdt, scanForIncomingTransfers, findMatchingPayment } from "@/lib/blockchain/payment-monitor";
import { verifyTransaction } from "@/lib/blockchain";
import type { CryptoCurrency } from "@/lib/types/database";

export const bookingRouter = router({
  // List bookings (filtered by role)
  list: protectedProcedure
    .input(bookingQuerySchema.optional())
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === "admin";

      const allBookings = await ctx.db
        .select({
          booking: bookings,
          villa: villas,
          user: users,
        })
        .from(bookings)
        .leftJoin(villas, eq(bookings.villaId, villas.id))
        .leftJoin(users, eq(bookings.userEmail, users.email))
        .orderBy(desc(bookings.createdAt));

      // Filter based on role
      let filteredBookings = isAdmin
        ? allBookings
        : allBookings.filter((b) => b.booking.userEmail === ctx.session.user.email);

      // Filter by villaId if provided
      if (input?.villaId) {
        filteredBookings = filteredBookings.filter((b) => b.booking.villaId === input.villaId);
      }

      // Filter by status if provided
      if (input?.status) {
        filteredBookings = filteredBookings.filter((b) => b.booking.status === input.status);
      }

      return filteredBookings;
    }),

  // Get booking by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select({
          booking: bookings,
          villa: villas,
          user: users,
        })
        .from(bookings)
        .leftJoin(villas, eq(bookings.villaId, villas.id))
        .leftJoin(users, eq(bookings.userEmail, users.email))
        .where(eq(bookings.id, input.id))
        .limit(1);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found",
        });
      }

      // Check authorization
      const isAdmin = ctx.session.user.role === "admin";
      const isGuest = result.booking.userEmail === ctx.session.user.email;
      const isHost = result.villa?.ownerEmail === ctx.session.user.email;

      if (!isAdmin && !isGuest && !isHost) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Unauthorized",
        });
      }

      // Get wallet config for payment info
      const [wallet] = await ctx.db.select().from(walletConfig).limit(1);

      let walletAddress = "";
      if (wallet) {
        switch (result.booking.cryptoCurrency) {
          case "btc":
            walletAddress = wallet.btcAddress || "";
            break;
          case "eth":
            walletAddress = wallet.ethAddress || "";
            break;
          case "usdt_eth":
            walletAddress = wallet.usdtEthAddress || "";
            break;
          case "usdt_bsc":
            walletAddress = wallet.usdtBscAddress || "";
            break;
        }
      }

      return {
        ...result,
        walletAddress,
      };
    }),

  // Create booking
  create: protectedProcedure
    .input(createBookingSchema)
    .mutation(async ({ ctx, input }) => {
      // Get villa
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

      if (!villa.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Villa is not available",
        });
      }

      const checkInDate = new Date(input.checkIn);
      const checkOutDate = new Date(input.checkOut);

      // Check for overlapping bookings
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
            or(
              and(lte(bookings.checkIn, checkInDate), gte(bookings.checkOut, checkInDate)),
              and(lte(bookings.checkIn, checkOutDate), gte(bookings.checkOut, checkOutDate)),
              and(gte(bookings.checkIn, checkInDate), lte(bookings.checkOut, checkOutDate))
            )
          )
        );

      if (existingBookings.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Selected dates are not available",
        });
      }

      // Calculate total price
      const nights = differenceInDays(checkOutDate, checkInDate);
      if (nights <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Check-out must be after check-in",
        });
      }

      const totalPrice = Number(villa.pricePerNight) * nights;
      const cryptoAmount = await convertUsdToCrypto(totalPrice, input.cryptoCurrency);
      const decimals = getCryptoDecimals(input.cryptoCurrency);

      // Create booking
      const [newBooking] = await ctx.db
        .insert(bookings)
        .values({
          villaId: input.villaId,
          userEmail: ctx.session.user.email,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          guests: input.guests || 1,
          totalPrice: totalPrice.toFixed(2),
          cryptoCurrency: input.cryptoCurrency,
          cryptoAmount: cryptoAmount.toFixed(decimals),
          status: "pending",
        })
        .returning();

      // Get wallet address for email
      const [wallet] = await ctx.db.select().from(walletConfig).limit(1);
      let walletAddress = "";
      if (wallet) {
        switch (input.cryptoCurrency as CryptoCurrency) {
          case "btc":
            walletAddress = wallet.btcAddress || "";
            break;
          case "eth":
            walletAddress = wallet.ethAddress || "";
            break;
          case "usdt_eth":
            walletAddress = wallet.usdtEthAddress || "";
            break;
          case "usdt_bsc":
            walletAddress = wallet.usdtBscAddress || "";
            break;
        }
      }

      // Send booking confirmation email
      if (walletAddress) {
        sendBookingConfirmationEmail({
          to: ctx.session.user.email,
          booking: newBooking,
          villa,
          walletAddress,
        }).catch((error) => {
          console.error("Failed to send booking confirmation email:", error);
        });
      }

      return newBooking;
    }),

  // Update booking (different rules for guest vs admin/host)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: updateBookingSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get existing booking with villa info
      const [result] = await ctx.db
        .select({
          booking: bookings,
          villa: villas,
        })
        .from(bookings)
        .leftJoin(villas, eq(bookings.villaId, villas.id))
        .where(eq(bookings.id, input.id))
        .limit(1);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found",
        });
      }

      const existing = result.booking;
      const villa = result.villa;

      const isAdmin = ctx.session.user.role === "admin";
      const isGuest = existing.userEmail === ctx.session.user.email;
      const isHost = villa?.ownerEmail === ctx.session.user.email;

      if (!isAdmin && !isGuest && !isHost) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Unauthorized",
        });
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      // Guest can only submit txHash
      if (isGuest && !isAdmin && !isHost) {
        if (input.data.txHash && existing.status === "pending") {
          // For USDT, verify the transaction on-chain
          if (existing.cryptoCurrency === "usdt_eth" || existing.cryptoCurrency === "usdt_bsc") {
            const [wallet] = await ctx.db.select().from(walletConfig).limit(1);
            if (!wallet) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Wallet not configured",
              });
            }

            const network = existing.cryptoCurrency === "usdt_eth" ? "eth" : "bsc";
            const walletAddress = network === "eth" ? wallet.usdtEthAddress : wallet.usdtBscAddress;

            if (!walletAddress) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Wallet address not configured",
              });
            }

            const verification = await verifyTransactionUsdt(input.data.txHash, walletAddress, network);

            if (!verification) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Transaction not found or not confirmed yet. Please wait a few minutes and try again.",
              });
            }

            // Check amount with 1% tolerance
            const expectedAmount = Number(existing.cryptoAmount);
            const tolerance = expectedAmount * 0.01;
            if (Math.abs(verification.amount - expectedAmount) > tolerance) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Amount mismatch. Expected ~${expectedAmount} USDT, received ${verification.amount} USDT`,
              });
            }

            updateData.txHash = input.data.txHash;
            updateData.status = "paid";
          } else {
            // BTC/ETH - accept txHash without on-chain verification
            updateData.txHash = input.data.txHash;
            updateData.status = "paid";
          }
        } else if (input.data.txHash) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Can only submit transaction hash for pending bookings",
          });
        }
      }

      // Admin or Host can update status and notes
      if (isAdmin || isHost) {
        if (input.data.status) {
          const validTransitions: Record<string, string[]> = {
            pending: ["paid", "cancelled"],
            paid: ["confirmed", "cancelled"],
            confirmed: ["completed", "cancelled"],
            completed: [],
            cancelled: [],
          };

          if (!validTransitions[existing.status]?.includes(input.data.status)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Cannot transition from ${existing.status} to ${input.data.status}`,
            });
          }
          updateData.status = input.data.status;
        }
        if (input.data.adminNotes !== undefined) {
          updateData.adminNotes = input.data.adminNotes;
        }
        if (input.data.txHash !== undefined) {
          updateData.txHash = input.data.txHash;
        }
      }

      const [updated] = await ctx.db
        .update(bookings)
        .set(updateData)
        .where(eq(bookings.id, input.id))
        .returning();

      // Send emails based on status changes
      const statusChanged = updateData.status && updateData.status !== existing.status;

      if (statusChanged && villa && existing.userEmail) {
        if (updateData.status === "paid" && updated.txHash) {
          sendPaymentReceivedEmail({
            to: existing.userEmail,
            booking: updated,
            villa,
            txHash: updated.txHash,
          }).catch((error) => {
            console.error("Failed to send payment received email:", error);
          });
        }

        if (updateData.status === "confirmed") {
          sendBookingConfirmedEmail({
            to: existing.userEmail,
            booking: updated,
            villa,
          }).catch((error) => {
            console.error("Failed to send booking confirmed email:", error);
          });
        }
      }

      return updated;
    }),

  // Get booked dates for a villa (public - for availability calendar)
  getBookedDates: protectedProcedure
    .input(z.object({ villaId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const bookedBookings = await ctx.db
        .select({
          checkIn: bookings.checkIn,
          checkOut: bookings.checkOut,
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.villaId, input.villaId),
            or(
              eq(bookings.status, "pending"),
              eq(bookings.status, "paid"),
              eq(bookings.status, "confirmed")
            )
          )
        );

      return bookedBookings;
    }),

  // Verify transaction for a booking
  verify: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get booking
      const [booking] = await ctx.db
        .select()
        .from(bookings)
        .where(eq(bookings.id, input.id))
        .limit(1);

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found",
        });
      }

      // Check authorization - admin or booking owner
      const isAdmin = ctx.session.user.role === "admin";
      const isOwner = booking.userEmail === ctx.session.user.email;

      if (!isAdmin && !isOwner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Unauthorized",
        });
      }

      // Check if booking has a tx hash
      if (!booking.txHash) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No transaction hash submitted",
        });
      }

      // Get wallet config
      const [wallet] = await ctx.db.select().from(walletConfig).limit(1);

      if (!wallet) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Wallet configuration not found",
        });
      }

      // Get the appropriate wallet address
      let walletAddress = "";
      switch (booking.cryptoCurrency) {
        case "btc":
          walletAddress = wallet.btcAddress || "";
          break;
        case "eth":
          walletAddress = wallet.ethAddress || "";
          break;
        case "usdt_eth":
          walletAddress = wallet.usdtEthAddress || "";
          break;
        case "usdt_bsc":
          walletAddress = wallet.usdtBscAddress || "";
          break;
      }

      if (!walletAddress) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Wallet address not configured for this cryptocurrency",
        });
      }

      // Verify the transaction
      const result = await verifyTransaction(
        booking.txHash,
        walletAddress,
        Number(booking.cryptoAmount),
        booking.cryptoCurrency
      );

      // If valid and confirmed, update booking status to "paid"
      if (result.valid && result.confirmed && booking.status === "pending") {
        const [updatedBooking] = await ctx.db
          .update(bookings)
          .set({
            status: "paid",
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, input.id))
          .returning();

        // Get villa for email
        const [villa] = await ctx.db
          .select()
          .from(villas)
          .where(eq(villas.id, booking.villaId))
          .limit(1);

        // Send payment received email
        if (villa && booking.userEmail && booking.txHash) {
          sendPaymentReceivedEmail({
            to: booking.userEmail,
            booking: updatedBooking,
            villa,
            txHash: booking.txHash,
          }).catch((error) => {
            console.error("Failed to send payment received email:", error);
          });
        }
      }

      return {
        verification: result,
        bookingStatus: result.valid && result.confirmed ? "paid" : booking.status,
      };
    }),

  // Check for automatic payment detection (USDT only)
  checkPayment: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get the booking
      const [booking] = await ctx.db
        .select()
        .from(bookings)
        .where(eq(bookings.id, input.id))
        .limit(1);

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found",
        });
      }

      // Check ownership or admin
      const isOwner = booking.userEmail === ctx.session.user.email;
      const isAdmin = ctx.session.user.role === "admin";

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Forbidden",
        });
      }

      // If already paid or has txHash, return current status
      if (booking.status !== "pending" || booking.txHash) {
        return {
          status: booking.status,
          txHash: booking.txHash,
          paid: booking.status !== "pending",
        };
      }

      // Only check USDT payments automatically
      if (
        booking.cryptoCurrency !== "usdt_eth" &&
        booking.cryptoCurrency !== "usdt_bsc"
      ) {
        return {
          status: booking.status,
          txHash: null,
          paid: false,
          message: "Manual verification required for this payment method",
        };
      }

      // Get wallet configuration
      const [wallet] = await ctx.db.select().from(walletConfig).limit(1);
      if (!wallet) {
        return {
          status: booking.status,
          paid: false,
          error: "Wallet not configured",
        };
      }

      const network = booking.cryptoCurrency === "usdt_eth" ? "eth" : "bsc";
      const walletAddress =
        network === "eth" ? wallet.usdtEthAddress : wallet.usdtBscAddress;

      if (!walletAddress) {
        return {
          status: booking.status,
          paid: false,
          error: "Wallet address not configured for this network",
        };
      }

      // Scan for recent transfers
      const transfers = await scanForIncomingTransfers(
        walletAddress,
        network,
        network === "eth" ? 500 : 1200
      );

      // Get already-used txHashes to avoid double-matching
      const usedBookings = await ctx.db
        .select({ txHash: bookings.txHash })
        .from(bookings)
        .where(and(
          isNotNull(bookings.txHash),
          ne(bookings.id, booking.id)
        ));
      const usedTxHashes = new Set(usedBookings.map(b => b.txHash?.toLowerCase()));

      // Filter out already-used transactions
      const availableTransfers = transfers.filter(
        t => !usedTxHashes.has(t.txHash.toLowerCase())
      );

      // Find matching payment
      const expectedAmount = Number(booking.cryptoAmount);
      const match = findMatchingPayment(availableTransfers, expectedAmount, new Date(booking.createdAt));

      if (match) {
        // Payment detected - store it but DON'T auto-mark as paid
        // Admin must review and confirm
        await ctx.db
          .update(bookings)
          .set({
            txHash: match.txHash,
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, booking.id));

        return {
          status: "pending",
          txHash: match.txHash,
          paid: false,
          paymentDetected: true,
          detectedAmount: match.amount,
          message: "Payment detected! Awaiting admin confirmation.",
        };
      }

      return {
        status: booking.status,
        txHash: null,
        paid: false,
        checking: true,
      };
    }),
});

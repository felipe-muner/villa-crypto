import { NextResponse } from "next/server";
import { db, bookings, walletConfig } from "@/lib/db";
import { eq, and, isNull, or, gte } from "drizzle-orm";
import {
  scanForIncomingTransfers,
  findMatchingPayment,
} from "@/lib/blockchain/payment-monitor";
import { subHours } from "date-fns";

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Header verification for security
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Verify cron secret if set
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // Get wallet configuration
    const [wallet] = await db.select().from(walletConfig).limit(1);
    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not configured" },
        { status: 400 }
      );
    }

    // Get pending bookings created in the last 24 hours without a txHash
    const pendingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "pending"),
          isNull(bookings.txHash),
          gte(bookings.createdAt, subHours(new Date(), 24)),
          or(
            eq(bookings.cryptoCurrency, "usdt_eth"),
            eq(bookings.cryptoCurrency, "usdt_bsc")
          )
        )
      );

    if (pendingBookings.length === 0) {
      return NextResponse.json({
        message: "No pending USDT bookings to check",
        checked: 0,
        matched: 0,
      });
    }

    // Group bookings by network
    const ethBookings = pendingBookings.filter(
      (b) => b.cryptoCurrency === "usdt_eth"
    );
    const bscBookings = pendingBookings.filter(
      (b) => b.cryptoCurrency === "usdt_bsc"
    );

    let matchedCount = 0;

    // Process ETH USDT bookings
    if (ethBookings.length > 0 && wallet.usdtEthAddress) {
      const ethTransfers = await scanForIncomingTransfers(
        wallet.usdtEthAddress,
        "eth",
        500 // ~1.5 hours of blocks
      );

      for (const booking of ethBookings) {
        const expectedAmount = Number(booking.cryptoAmount);
        const match = findMatchingPayment(
          ethTransfers,
          expectedAmount,
          booking.createdAt
        );

        if (match) {
          // Update booking with payment info
          await db
            .update(bookings)
            .set({
              txHash: match.txHash,
              status: "paid",
              updatedAt: new Date(),
            })
            .where(eq(bookings.id, booking.id));

          matchedCount++;
          console.log(
            `Payment found for booking ${booking.id}: ${match.txHash}`
          );
        }
      }
    }

    // Process BSC USDT bookings
    if (bscBookings.length > 0 && wallet.usdtBscAddress) {
      const bscTransfers = await scanForIncomingTransfers(
        wallet.usdtBscAddress,
        "bsc",
        1200 // ~1 hour of blocks (BSC is faster)
      );

      for (const booking of bscBookings) {
        const expectedAmount = Number(booking.cryptoAmount);
        const match = findMatchingPayment(
          bscTransfers,
          expectedAmount,
          booking.createdAt
        );

        if (match) {
          // Update booking with payment info
          await db
            .update(bookings)
            .set({
              txHash: match.txHash,
              status: "paid",
              updatedAt: new Date(),
            })
            .where(eq(bookings.id, booking.id));

          matchedCount++;
          console.log(
            `Payment found for booking ${booking.id}: ${match.txHash}`
          );
        }
      }
    }

    return NextResponse.json({
      message: "Payment check completed",
      checked: pendingBookings.length,
      matched: matchedCount,
    });
  } catch (error) {
    console.error("Error checking payments:", error);
    return NextResponse.json(
      { error: "Failed to check payments" },
      { status: 500 }
    );
  }
}

// Also allow POST for manual trigger
export async function POST(request: Request) {
  return GET(request);
}

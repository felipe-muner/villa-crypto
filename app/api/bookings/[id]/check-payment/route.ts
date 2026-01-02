import { NextResponse } from "next/server";
import { db, bookings, walletConfig } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  scanForIncomingTransfers,
  findMatchingPayment,
} from "@/lib/blockchain/payment-monitor";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check ownership or admin
    const isOwner = booking.userEmail === session.user.email;
    const isAdmin = session.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If already paid or has txHash, return current status
    if (booking.status !== "pending" || booking.txHash) {
      return NextResponse.json({
        status: booking.status,
        txHash: booking.txHash,
        paid: booking.status !== "pending",
      });
    }

    // Only check USDT payments automatically
    if (
      booking.cryptoCurrency !== "usdt_eth" &&
      booking.cryptoCurrency !== "usdt_bsc"
    ) {
      return NextResponse.json({
        status: booking.status,
        txHash: null,
        paid: false,
        message: "Manual verification required for this payment method",
      });
    }

    // Get wallet configuration
    const [wallet] = await db.select().from(walletConfig).limit(1);
    if (!wallet) {
      return NextResponse.json({
        status: booking.status,
        paid: false,
        error: "Wallet not configured",
      });
    }

    const network = booking.cryptoCurrency === "usdt_eth" ? "eth" : "bsc";
    const walletAddress =
      network === "eth" ? wallet.usdtEthAddress : wallet.usdtBscAddress;

    if (!walletAddress) {
      return NextResponse.json({
        status: booking.status,
        paid: false,
        error: "Wallet address not configured for this network",
      });
    }

    // Scan for recent transfers
    const transfers = await scanForIncomingTransfers(
      walletAddress,
      network,
      network === "eth" ? 500 : 1200
    );

    // Find matching payment
    const expectedAmount = Number(booking.cryptoAmount);
    const match = findMatchingPayment(transfers, expectedAmount, booking.createdAt);

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

      return NextResponse.json({
        status: "paid",
        txHash: match.txHash,
        paid: true,
        amount: match.amount,
      });
    }

    return NextResponse.json({
      status: booking.status,
      txHash: null,
      paid: false,
      checking: true,
    });
  } catch (error) {
    console.error("Error checking payment:", error);
    return NextResponse.json(
      { error: "Failed to check payment" },
      { status: 500 }
    );
  }
}

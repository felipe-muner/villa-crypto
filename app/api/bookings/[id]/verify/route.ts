import { NextRequest, NextResponse } from "next/server";
import { db, bookings, walletConfig } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { verifyTransaction } from "@/lib/blockchain";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check authorization - admin or booking owner
    const isAdmin = session.user.role === "admin";
    const isOwner = booking.userEmail === session.user.email;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if booking has a tx hash
    if (!booking.txHash) {
      return NextResponse.json(
        { error: "No transaction hash submitted" },
        { status: 400 }
      );
    }

    // Get wallet config
    const [wallet] = await db.select().from(walletConfig).limit(1);

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet configuration not found" },
        { status: 500 }
      );
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
      return NextResponse.json(
        { error: "Wallet address not configured for this cryptocurrency" },
        { status: 500 }
      );
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
      await db
        .update(bookings)
        .set({
          status: "paid",
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, id));
    }

    return NextResponse.json({
      verification: result,
      bookingStatus: result.valid && result.confirmed ? "paid" : booking.status,
    });
  } catch (error) {
    console.error("Error verifying transaction:", error);
    return NextResponse.json(
      { error: "Failed to verify transaction" },
      { status: 500 }
    );
  }
}

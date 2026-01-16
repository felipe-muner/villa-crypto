import { NextRequest, NextResponse } from "next/server";
import { db, bookings, villas, users, walletConfig } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { sendPaymentReceivedEmail, sendBookingConfirmedEmail } from "@/lib/email";
import { verifyTransaction } from "@/lib/blockchain/payment-monitor";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [result] = await db
      .select({
        booking: bookings,
        villa: villas,
        user: users,
      })
      .from(bookings)
      .leftJoin(villas, eq(bookings.villaId, villas.id))
      .leftJoin(users, eq(bookings.userEmail, users.email))
      .where(eq(bookings.id, id))
      .limit(1);

    if (!result) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check authorization - admin, booking owner (guest), or villa owner (host)
    const isAdmin = session.user.role === "admin";
    const isGuest = result.booking.userEmail === session.user.email;
    const isHost = result.villa?.ownerEmail === session.user.email;

    if (!isAdmin && !isGuest && !isHost) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get wallet config for payment info
    const [wallet] = await db.select().from(walletConfig).limit(1);

    // Get the appropriate wallet address based on crypto currency
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

    return NextResponse.json({
      ...result,
      walletAddress,
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Get existing booking with villa info
    const [result] = await db
      .select({
        booking: bookings,
        villa: villas,
      })
      .from(bookings)
      .leftJoin(villas, eq(bookings.villaId, villas.id))
      .where(eq(bookings.id, id))
      .limit(1);

    if (!result) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const existing = result.booking;
    const villa = result.villa;

    const isAdmin = session.user.role === "admin";
    const isGuest = existing.userEmail === session.user.email;
    const isHost = villa?.ownerEmail === session.user.email;

    // Determine what can be updated based on role
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Guest can only submit txHash
    if (isGuest && !isAdmin && !isHost) {
      if (body.txHash && existing.status === "pending") {
        // For USDT, verify the transaction on-chain before accepting
        if (existing.cryptoCurrency === "usdt_eth" || existing.cryptoCurrency === "usdt_bsc") {
          const [wallet] = await db.select().from(walletConfig).limit(1);
          if (!wallet) {
            return NextResponse.json({ error: "Wallet not configured" }, { status: 500 });
          }

          const network = existing.cryptoCurrency === "usdt_eth" ? "eth" : "bsc";
          const walletAddress = network === "eth" ? wallet.usdtEthAddress : wallet.usdtBscAddress;

          if (!walletAddress) {
            return NextResponse.json({ error: "Wallet address not configured" }, { status: 500 });
          }

          // Verify transaction on-chain
          const verification = await verifyTransaction(body.txHash, walletAddress, network);

          if (!verification) {
            return NextResponse.json(
              { error: "Transaction not found or not confirmed yet. Please wait a few minutes and try again." },
              { status: 400 }
            );
          }

          // Check amount with 1% tolerance
          const expectedAmount = Number(existing.cryptoAmount);
          const tolerance = expectedAmount * 0.01;
          if (Math.abs(verification.amount - expectedAmount) > tolerance) {
            return NextResponse.json(
              { error: `Amount mismatch. Expected ~${expectedAmount} USDT, received ${verification.amount} USDT` },
              { status: 400 }
            );
          }

          updateData.txHash = body.txHash;
          updateData.status = "paid";
        } else {
          // BTC/ETH - accept txHash without on-chain verification (manual admin review)
          updateData.txHash = body.txHash;
          updateData.status = "paid";
        }
      } else if (body.txHash) {
        return NextResponse.json(
          { error: "Can only submit transaction hash for pending bookings" },
          { status: 400 }
        );
      }
    }

    // Admin or Host can update status and notes
    if (isAdmin || isHost) {
      if (body.status) {
        // Validate status transitions
        const validTransitions: Record<string, string[]> = {
          pending: ["paid", "cancelled"], // Admin/Host can mark as paid manually
          paid: ["confirmed", "cancelled"],
          confirmed: ["completed", "cancelled"],
          completed: [],
          cancelled: [],
        };

        if (!validTransitions[existing.status]?.includes(body.status)) {
          return NextResponse.json(
            {
              error: `Cannot transition from ${existing.status} to ${body.status}`,
            },
            { status: 400 }
          );
        }
        updateData.status = body.status;
      }
      if (body.adminNotes !== undefined) {
        updateData.adminNotes = body.adminNotes;
      }
      if (body.txHash !== undefined) {
        updateData.txHash = body.txHash;
      }
    }

    if (!isAdmin && !isGuest && !isHost) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [updated] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();

    // Send emails based on status changes
    const statusChanged = updateData.status && updateData.status !== existing.status;

    if (statusChanged) {
      // Get villa for email
      const [villa] = await db
        .select()
        .from(villas)
        .where(eq(villas.id, existing.villaId))
        .limit(1);

      if (villa && existing.userEmail) {
        // Send payment received email when status changes to "paid"
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

        // Send booking confirmed email when status changes to "confirmed"
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
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

// PATCH is alias for PUT
export { PUT as PATCH };

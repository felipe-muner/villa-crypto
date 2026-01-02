import { NextRequest, NextResponse } from "next/server";
import { db, bookings, villas, users, walletConfig } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

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

    // Check authorization - admin or booking owner
    const isAdmin = session.user.role === "admin";
    const isOwner = result.booking.userEmail === session.user.email;

    if (!isAdmin && !isOwner) {
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

    // Get existing booking
    const [existing] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isAdmin = session.user.role === "admin";
    const isOwner = existing.userEmail === session.user.email;

    // Determine what can be updated based on role
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Guest can only submit txHash
    if (isOwner && !isAdmin) {
      if (body.txHash && existing.status === "pending") {
        updateData.txHash = body.txHash;
        updateData.status = "paid"; // Move to paid when txHash is submitted
      } else if (body.txHash) {
        return NextResponse.json(
          { error: "Can only submit transaction hash for pending bookings" },
          { status: 400 }
        );
      }
    }

    // Admin can update status and notes
    if (isAdmin) {
      if (body.status) {
        // Validate status transitions
        const validTransitions: Record<string, string[]> = {
          pending: ["cancelled"],
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

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [updated] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

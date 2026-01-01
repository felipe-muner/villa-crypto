import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, walletConfig } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [config] = await db
      .select()
      .from(walletConfig)
      .where(eq(walletConfig.id, 1))
      .limit(1);

    if (!config) {
      // Return empty config if not set
      return NextResponse.json({
        btcAddress: null,
        ethAddress: null,
        usdtEthAddress: null,
        usdtBscAddress: null,
      });
    }

    return NextResponse.json({
      btcAddress: config.btcAddress,
      ethAddress: config.ethAddress,
      usdtEthAddress: config.usdtEthAddress,
      usdtBscAddress: config.usdtBscAddress,
    });
  } catch (error) {
    console.error("Error fetching wallet config:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet configuration" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Check if config exists
    const [existingConfig] = await db
      .select()
      .from(walletConfig)
      .where(eq(walletConfig.id, 1))
      .limit(1);

    if (existingConfig) {
      // Update existing config
      await db
        .update(walletConfig)
        .set({
          btcAddress: body.btcAddress || null,
          ethAddress: body.ethAddress || null,
          usdtEthAddress: body.usdtEthAddress || null,
          usdtBscAddress: body.usdtBscAddress || null,
          updatedAt: new Date(),
          updatedBy: session.user.email,
        })
        .where(eq(walletConfig.id, 1));
    } else {
      // Insert new config
      await db.insert(walletConfig).values({
        id: 1,
        btcAddress: body.btcAddress || null,
        ethAddress: body.ethAddress || null,
        usdtEthAddress: body.usdtEthAddress || null,
        usdtBscAddress: body.usdtBscAddress || null,
        updatedBy: session.user.email,
      });
    }

    return NextResponse.json({ message: "Wallet configuration updated" });
  } catch (error) {
    console.error("Error updating wallet config:", error);
    return NextResponse.json(
      { error: "Failed to update wallet configuration" },
      { status: 500 }
    );
  }
}

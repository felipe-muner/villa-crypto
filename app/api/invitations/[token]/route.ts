import { NextResponse } from "next/server";
import { db, hostInvitations } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";

type RouteParams = { params: Promise<{ token: string }> };

// GET - Fetch invitation by token
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;

    const [invitation] = await db
      .select()
      .from(hostInvitations)
      .where(eq(hostInvitations.token, token))
      .limit(1);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Check if expired
    if (invitation.status === "pending" && new Date() > invitation.expiresAt) {
      await db
        .update(hostInvitations)
        .set({ status: "expired" })
        .where(eq(hostInvitations.id, invitation.id));

      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      email: invitation.email,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 }
    );
  }
}

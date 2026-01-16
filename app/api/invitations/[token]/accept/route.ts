import { NextResponse } from "next/server";
import { db, hostInvitations, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

type RouteParams = { params: Promise<{ token: string }> };

// POST - Accept invitation
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;

    // Get invitation
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

    // Check if already accepted
    if (invitation.status === "accepted") {
      return NextResponse.json(
        { error: "Invitation already accepted" },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      await db
        .update(hostInvitations)
        .set({ status: "expired" })
        .where(eq(hostInvitations.id, invitation.id));

      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 410 }
      );
    }

    // Check email matches
    if (session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invitation is for a different email address" },
        { status: 403 }
      );
    }

    // Update invitation status
    await db
      .update(hostInvitations)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
      })
      .where(eq(hostInvitations.id, invitation.id));

    // Update user to be a host
    await db
      .update(users)
      .set({
        isHost: true,
        updatedAt: new Date(),
      })
      .where(eq(users.email, session.user.email));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db, hostInvitations, users } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { addDays } from "date-fns";
import { Resend } from "resend";

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
};

// GET - List all invitations
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invitations = await db
      .select()
      .from(hostInvitations)
      .orderBy(desc(hostInvitations.createdAt));

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

// POST - Create new invitation and send email
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if invitation already exists
    const [existing] = await db
      .select()
      .from(hostInvitations)
      .where(eq(hostInvitations.email, email))
      .limit(1);

    if (existing && existing.status === "accepted") {
      return NextResponse.json(
        { error: "This email is already a host" },
        { status: 400 }
      );
    }

    if (existing && existing.status === "pending") {
      return NextResponse.json(
        { error: "Invitation already sent to this email" },
        { status: 400 }
      );
    }

    // Check if user already exists and is a host
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser?.isHost) {
      return NextResponse.json(
        { error: "This user is already a host" },
        { status: 400 }
      );
    }

    // Generate unique token
    const token = randomBytes(32).toString("hex");
    const expiresAt = addDays(new Date(), 7); // 7 days to accept

    // Create invitation
    const [invitation] = await db
      .insert(hostInvitations)
      .values({
        email,
        invitedBy: session.user.email,
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
        to: email,
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

            <h2>Hello${name ? ` ${name}` : ""}!</h2>

            <p>You've been invited to become a <strong>Host</strong> on Villa Crypto - a platform for listing and renting villas with cryptocurrency payments.</p>

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
              This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
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

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}

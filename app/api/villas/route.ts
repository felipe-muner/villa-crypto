import { NextRequest, NextResponse } from "next/server";
import { db, villas } from "@/lib/db";
import { desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const allVillas = await db.select().from(villas).orderBy(desc(villas.createdAt));
    return NextResponse.json(allVillas);
  } catch (error) {
    console.error("Error fetching villas:", error);
    return NextResponse.json(
      { error: "Failed to fetch villas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is authenticated and is either admin or host
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const isAdmin = session.user.role === "admin";
    const isHost = session.user.isHost;

    if (!isAdmin && !isHost) {
      return NextResponse.json(
        { error: "Only hosts and admins can create villas" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Villa name is required" },
        { status: 400 }
      );
    }

    if (!body.pricePerNight) {
      return NextResponse.json(
        { error: "Price per night is required" },
        { status: 400 }
      );
    }

    // Determine ownerEmail
    // - Hosts: always set to their email
    // - Admins: can optionally set ownerEmail or leave null for platform villas
    let ownerEmail: string | null = null;
    if (isHost && !isAdmin) {
      ownerEmail = session.user.email;
    } else if (isAdmin && body.ownerEmail) {
      ownerEmail = body.ownerEmail;
    }

    const [newVilla] = await db
      .insert(villas)
      .values({
        name: body.name,
        description: body.description || null,
        location: body.location || null,
        pricePerNight: body.pricePerNight,
        images: body.images || [],
        amenities: body.amenities || [],
        maxGuests: body.maxGuests || 1,
        bedrooms: body.bedrooms || 1,
        bathrooms: body.bathrooms || 1,
        isActive: body.isActive ?? true,
        ownerEmail,
      })
      .returning();

    return NextResponse.json(newVilla, { status: 201 });
  } catch (error) {
    console.error("Error adding villa:", error);
    return NextResponse.json(
      { error: "Failed to add villa" },
      { status: 500 }
    );
  }
}

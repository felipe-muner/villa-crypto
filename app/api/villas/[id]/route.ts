import { NextRequest, NextResponse } from "next/server";
import { db, villas } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const [villa] = await db.select().from(villas).where(eq(villas.id, id)).limit(1);

    if (!villa) {
      return NextResponse.json({ error: "Villa not found" }, { status: 404 });
    }

    return NextResponse.json(villa);
  } catch (error) {
    console.error("Error fetching villa:", error);
    return NextResponse.json(
      { error: "Failed to fetch villa" },
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
    const isAdmin = session.user.role === "admin";

    // Check ownership for non-admins
    if (!isAdmin) {
      const [existingVilla] = await db
        .select()
        .from(villas)
        .where(and(eq(villas.id, id), eq(villas.ownerEmail, session.user.email)))
        .limit(1);

      if (!existingVilla) {
        return NextResponse.json(
          { error: "Villa not found or you don't have permission" },
          { status: 404 }
        );
      }
    }

    const [updatedVilla] = await db
      .update(villas)
      .set({
        name: body.name,
        description: body.description,
        location: body.location,
        pricePerNight: body.pricePerNight,
        images: body.images,
        amenities: body.amenities,
        maxGuests: body.maxGuests,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        isActive: body.isActive,
        updatedAt: new Date(),
      })
      .where(eq(villas.id, id))
      .returning();

    if (!updatedVilla) {
      return NextResponse.json({ error: "Villa not found" }, { status: 404 });
    }

    return NextResponse.json(updatedVilla);
  } catch (error) {
    console.error("Error updating villa:", error);
    return NextResponse.json(
      { error: "Failed to update villa" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isAdmin = session.user.role === "admin";

    // Check ownership for non-admins
    if (!isAdmin) {
      const [existingVilla] = await db
        .select()
        .from(villas)
        .where(and(eq(villas.id, id), eq(villas.ownerEmail, session.user.email)))
        .limit(1);

      if (!existingVilla) {
        return NextResponse.json(
          { error: "Villa not found or you don't have permission" },
          { status: 404 }
        );
      }
    }

    const [deleted] = await db
      .delete(villas)
      .where(eq(villas.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Villa not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Villa deleted successfully" });
  } catch (error) {
    console.error("Error deleting villa:", error);
    return NextResponse.json(
      { error: "Failed to delete villa" },
      { status: 500 }
    );
  }
}

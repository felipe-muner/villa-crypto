import { NextRequest, NextResponse } from "next/server";
import { db, villas } from "@/lib/db";
import { desc } from "drizzle-orm";

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

import { NextRequest, NextResponse } from "next/server";
import { db, villas, bookings } from "@/lib/db";
import { eq, and, or, gte, lte, notInArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const guests = searchParams.get("guests");

    // Get all active villas
    let query = db.select().from(villas).where(eq(villas.isActive, true));
    let allVillas = await query;

    // Filter by guests if specified
    if (guests) {
      const guestCount = parseInt(guests, 10);
      allVillas = allVillas.filter(
        (villa) => (villa.maxGuests || 1) >= guestCount
      );
    }

    // If dates are provided, filter by availability
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      // Find villas with overlapping bookings
      const overlappingBookings = await db
        .select({ villaId: bookings.villaId })
        .from(bookings)
        .where(
          and(
            or(
              eq(bookings.status, "pending"),
              eq(bookings.status, "paid"),
              eq(bookings.status, "confirmed")
            ),
            or(
              // New booking starts during existing booking
              and(
                lte(bookings.checkIn, checkInDate),
                gte(bookings.checkOut, checkInDate)
              ),
              // New booking ends during existing booking
              and(
                lte(bookings.checkIn, checkOutDate),
                gte(bookings.checkOut, checkOutDate)
              ),
              // New booking contains existing booking
              and(
                gte(bookings.checkIn, checkInDate),
                lte(bookings.checkOut, checkOutDate)
              )
            )
          )
        );

      const unavailableVillaIds = new Set(
        overlappingBookings.map((b) => b.villaId)
      );

      // Filter out unavailable villas
      allVillas = allVillas.filter(
        (villa) => !unavailableVillaIds.has(villa.id)
      );
    }

    return NextResponse.json(allVillas);
  } catch (error) {
    console.error("Error fetching available villas:", error);
    return NextResponse.json(
      { error: "Failed to fetch villas" },
      { status: 500 }
    );
  }
}

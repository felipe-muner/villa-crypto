import { NextRequest, NextResponse } from "next/server";
import { db, bookings, villas, users } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, desc, and, or, gte, lte } from "drizzle-orm";
import { convertUsdToCrypto, getCryptoDecimals } from "@/lib/crypto/prices";
import { differenceInDays } from "date-fns";
import { generateUniqueAmount } from "@/lib/blockchain/payment-monitor";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const villaId = searchParams.get("villaId");

    // Admin sees all bookings, users see only their own
    const isAdmin = session.user.role === "admin";

    let query = db
      .select({
        booking: bookings,
        villa: villas,
        user: users,
      })
      .from(bookings)
      .leftJoin(villas, eq(bookings.villaId, villas.id))
      .leftJoin(users, eq(bookings.userEmail, users.email))
      .orderBy(desc(bookings.createdAt));

    const allBookings = await query;

    // Filter based on role
    const filteredBookings = isAdmin
      ? allBookings
      : allBookings.filter((b) => b.booking.userEmail === session.user.email);

    // Filter by villaId if provided
    const result = villaId
      ? filteredBookings.filter((b) => b.booking.villaId === villaId)
      : filteredBookings;

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { villaId, checkIn, checkOut, guests, cryptoCurrency } = body;

    // Validate required fields
    if (!villaId || !checkIn || !checkOut || !cryptoCurrency) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get villa to calculate price
    const [villa] = await db
      .select()
      .from(villas)
      .where(eq(villas.id, villaId))
      .limit(1);

    if (!villa) {
      return NextResponse.json({ error: "Villa not found" }, { status: 404 });
    }

    if (!villa.isActive) {
      return NextResponse.json(
        { error: "Villa is not available" },
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Check for overlapping bookings
    const existingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.villaId, villaId),
          or(
            eq(bookings.status, "pending"),
            eq(bookings.status, "paid"),
            eq(bookings.status, "confirmed")
          ),
          or(
            and(lte(bookings.checkIn, checkInDate), gte(bookings.checkOut, checkInDate)),
            and(lte(bookings.checkIn, checkOutDate), gte(bookings.checkOut, checkOutDate)),
            and(gte(bookings.checkIn, checkInDate), lte(bookings.checkOut, checkOutDate))
          )
        )
      );

    if (existingBookings.length > 0) {
      return NextResponse.json(
        { error: "Selected dates are not available" },
        { status: 400 }
      );
    }

    // Calculate total price
    const nights = differenceInDays(checkOutDate, checkInDate);
    if (nights <= 0) {
      return NextResponse.json(
        { error: "Check-out must be after check-in" },
        { status: 400 }
      );
    }

    const totalPrice = Number(villa.pricePerNight) * nights;
    let cryptoAmount = await convertUsdToCrypto(totalPrice, cryptoCurrency);
    const decimals = getCryptoDecimals(cryptoCurrency);

    // For USDT payments, add unique cents to make the amount identifiable
    // This helps with automatic payment detection
    if (cryptoCurrency === "usdt_eth" || cryptoCurrency === "usdt_bsc") {
      cryptoAmount = generateUniqueAmount(cryptoAmount);
    }

    // Create booking
    const [newBooking] = await db
      .insert(bookings)
      .values({
        villaId,
        userEmail: session.user.email,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: guests || 1,
        totalPrice: totalPrice.toFixed(2),
        cryptoCurrency,
        cryptoAmount: cryptoAmount.toFixed(decimals),
        status: "pending",
      })
      .returning();

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

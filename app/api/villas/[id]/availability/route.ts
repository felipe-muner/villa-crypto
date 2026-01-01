import { NextRequest, NextResponse } from "next/server";
import { getVillaById } from "@/lib/utils/storage";
import {
  fetchAndParseIcal,
  mergeBookedPeriods,
} from "@/lib/utils/ical-parser";
import { BookedPeriod } from "@/lib/types/villa";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const villa = await getVillaById(id);

    if (!villa) {
      return NextResponse.json({ error: "Villa not found" }, { status: 404 });
    }

    let airbnbPeriods: BookedPeriod[] = [];
    let bookingPeriods: BookedPeriod[] = [];
    const errors: string[] = [];

    // Fetch Airbnb calendar if URL exists
    if (villa.airbnbCalendarUrl) {
      try {
        airbnbPeriods = await fetchAndParseIcal(villa.airbnbCalendarUrl);
      } catch (error) {
        errors.push(
          `Airbnb: ${error instanceof Error ? error.message : "Failed to fetch"}`
        );
      }
    }

    // Fetch Booking.com calendar if URL exists
    if (villa.bookingCalendarUrl) {
      try {
        bookingPeriods = await fetchAndParseIcal(villa.bookingCalendarUrl);
      } catch (error) {
        errors.push(
          `Booking: ${error instanceof Error ? error.message : "Failed to fetch"}`
        );
      }
    }

    // Merge all booked periods
    const allBookedPeriods = mergeBookedPeriods(airbnbPeriods, bookingPeriods);

    return NextResponse.json({
      villaId: villa.id,
      villaName: villa.name,
      airbnb: {
        configured: !!villa.airbnbCalendarUrl,
        bookedPeriods: airbnbPeriods,
      },
      booking: {
        configured: !!villa.bookingCalendarUrl,
        bookedPeriods: bookingPeriods,
      },
      combined: {
        bookedPeriods: allBookedPeriods,
      },
      lastChecked: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}

import { db, villas, bookings, blockedDates } from "@/lib/db";
import { eq, and, or, gte } from "drizzle-orm";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BookingForm } from "./BookingForm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  MapPin,
  Users,
  Bed,
  Bath,
  Check,
  Home,
} from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;
};

export default async function VillaDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { checkIn, checkOut, guests } = await searchParams;

  const [villa] = await db
    .select()
    .from(villas)
    .where(eq(villas.id, id))
    .limit(1);

  if (!villa || !villa.isActive) {
    notFound();
  }

  const existingBookings = await db
    .select({
      checkIn: bookings.checkIn,
      checkOut: bookings.checkOut,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.villaId, id),
        or(
          eq(bookings.status, "pending"),
          eq(bookings.status, "paid"),
          eq(bookings.status, "confirmed")
        ),
        gte(bookings.checkOut, new Date())
      )
    );

  const bookedDates = existingBookings.map((b) => ({
    checkIn: b.checkIn.toISOString(),
    checkOut: b.checkOut.toISOString(),
  }));

  // Get blocked dates for this villa
  const villaBlockedDates = await db
    .select({
      startDate: blockedDates.startDate,
      endDate: blockedDates.endDate,
    })
    .from(blockedDates)
    .where(
      and(
        eq(blockedDates.villaId, id),
        gte(blockedDates.endDate, new Date())
      )
    );

  const blockedDateRanges = villaBlockedDates.map((b) => ({
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link href="/villas">
          <Button variant="ghost" className="mb-6 -ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to villas
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Villa Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <div>
              {villa.images && villa.images.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {villa.images.slice(0, 4).map((image, index) => (
                    <div
                      key={index}
                      className={`relative ${
                        index === 0 ? "md:col-span-2 h-80" : "h-48"
                      } rounded-xl overflow-hidden`}
                    >
                      <Image
                        src={image}
                        alt={`${villa.name} - ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-80 bg-muted rounded-xl flex items-center justify-center">
                  <Home className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Details */}
            <Card>
              <CardContent className="pt-6">
                <h1 className="text-3xl font-bold mb-2">{villa.name}</h1>
                {villa.location && (
                  <p className="text-muted-foreground flex items-center mb-6">
                    <MapPin className="h-5 w-5 mr-2" />
                    {villa.location}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 py-4 border-y">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{villa.maxGuests}</p>
                    <p className="text-sm text-muted-foreground">Guests</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Bed className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{villa.bedrooms}</p>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Bath className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{villa.bathrooms}</p>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                  </div>
                </div>

                {/* Description */}
                {villa.description && (
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">About this villa</h2>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {villa.description}
                    </p>
                  </div>
                )}

                {/* Amenities */}
                {villa.amenities && villa.amenities.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-3">Amenities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {villa.amenities.map((amenity, index) => (
                        <div
                          key={index}
                          className="flex items-center text-muted-foreground"
                        >
                          <Check className="h-5 w-5 mr-2 text-green-500" />
                          {amenity}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="pt-6">
                <div className="flex items-baseline mb-6">
                  <span className="text-3xl font-bold">
                    ${Number(villa.pricePerNight).toFixed(0)}
                  </span>
                  <span className="text-muted-foreground ml-2">/ night</span>
                </div>

                <BookingForm
                  villaId={villa.id}
                  pricePerNight={Number(villa.pricePerNight)}
                  maxGuests={villa.maxGuests || 1}
                  bookedDates={bookedDates}
                  blockedDates={blockedDateRanges}
                  initialCheckIn={checkIn}
                  initialCheckOut={checkOut}
                  initialGuests={guests ? parseInt(guests, 10) : undefined}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

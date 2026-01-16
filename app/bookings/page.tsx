import { auth } from "@/lib/auth";
import { db, bookings, villas } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { format, isPast, isFuture, isToday } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import {
  Calendar,
  MapPin,
  Search,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ImageIcon,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MyBookingsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const myBookings = await db
    .select({
      booking: bookings,
      villa: villas,
    })
    .from(bookings)
    .leftJoin(villas, eq(bookings.villaId, villas.id))
    .where(eq(bookings.userEmail, session.user.email))
    .orderBy(desc(bookings.createdAt));

  // Separate upcoming and past bookings
  const now = new Date();
  const upcomingBookings = myBookings.filter(
    ({ booking }) =>
      isFuture(new Date(booking.checkIn)) || isToday(new Date(booking.checkIn))
  );
  const pastBookings = myBookings.filter(
    ({ booking }) =>
      isPast(new Date(booking.checkIn)) && !isToday(new Date(booking.checkIn))
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          variant: "secondary" as const,
          icon: AlertCircle,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
          message: "Awaiting payment",
        };
      case "paid":
        return {
          variant: "default" as const,
          icon: Clock,
          color: "text-blue-600",
          bgColor: "bg-blue-100 dark:bg-blue-900/30",
          message: "Payment received - awaiting confirmation",
        };
      case "confirmed":
        return {
          variant: "default" as const,
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100 dark:bg-green-900/30",
          message: "Booking confirmed",
        };
      case "cancelled":
        return {
          variant: "destructive" as const,
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-100 dark:bg-red-900/30",
          message: "Booking cancelled",
        };
      case "completed":
        return {
          variant: "outline" as const,
          icon: CheckCircle,
          color: "text-gray-600",
          bgColor: "bg-gray-100 dark:bg-gray-800",
          message: "Stay completed",
        };
      default:
        return {
          variant: "outline" as const,
          icon: AlertCircle,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          message: status,
        };
    }
  };

  const BookingCard = ({
    booking,
    villa,
  }: {
    booking: typeof bookings.$inferSelect;
    villa: typeof villas.$inferSelect | null;
  }) => {
    const status = getStatusConfig(booking.status);
    const StatusIcon = status.icon;
    const nights = Math.ceil(
      (new Date(booking.checkOut).getTime() -
        new Date(booking.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return (
      <Link href={`/bookings/${booking.id}`}>
        <Card className="hover:shadow-lg transition-all cursor-pointer overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row">
              {/* Villa Image */}
              <div className="relative w-full sm:w-48 h-40 sm:h-auto flex-shrink-0">
                {villa?.images && villa.images.length > 0 ? (
                  <Image
                    src={villa.images[0]}
                    alt={villa?.name || "Villa"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {/* Status badge overlay */}
                <div className="absolute top-2 left-2">
                  <Badge
                    variant={status.variant}
                    className={`${status.bgColor} ${status.color} border-0`}
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {booking.status.charAt(0).toUpperCase() +
                      booking.status.slice(1)}
                  </Badge>
                </div>
              </div>

              {/* Booking Details */}
              <div className="flex-1 p-4 sm:p-5">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">
                      {villa?.name || "Unknown Villa"}
                    </h2>
                    {villa?.location && (
                      <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {villa.location}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(booking.checkIn), "MMM d")} -{" "}
                          {format(new Date(booking.checkOut), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {nights} night{nights > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {booking.guests ?? 1} guest{(booking.guests ?? 1) > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {status.message}
                    </p>
                    <p className="font-semibold text-lg">
                      ${Number(booking.totalPrice).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Bookings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your villa reservations
            </p>
          </div>
          <Link href="/villas">
            <Button>
              <Search className="mr-2 h-4 w-4" />
              Browse Villas
            </Button>
          </Link>
        </div>

        {myBookings.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <Calendar className="mx-auto h-16 w-16 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No bookings yet</h3>
              <p className="mt-2 text-muted-foreground">
                Browse our villas and make your first booking!
              </p>
              <Link href="/villas">
                <Button className="mt-6">Explore Villas</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming ({upcomingBookings.length})
                </h2>
                <div className="space-y-4">
                  {upcomingBookings.map(({ booking, villa }) => (
                    <BookingCard key={booking.id} booking={booking} villa={villa} />
                  ))}
                </div>
              </section>
            )}

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  Past Bookings ({pastBookings.length})
                </h2>
                <div className="space-y-4 opacity-75">
                  {pastBookings.map(({ booking, villa }) => (
                    <BookingCard key={booking.id} booking={booking} villa={villa} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

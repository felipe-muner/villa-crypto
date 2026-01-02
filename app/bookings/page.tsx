import { auth } from "@/lib/auth";
import { db, bookings, villas } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Home, Search } from "lucide-react";

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

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "pending":
        return "secondary";
      case "paid":
        return "default";
      case "confirmed":
        return "default";
      case "cancelled":
        return "destructive";
      case "completed":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending":
        return "Awaiting payment";
      case "paid":
        return "Payment received - awaiting confirmation";
      case "confirmed":
        return "Booking confirmed";
      case "cancelled":
        return "Booking cancelled";
      case "completed":
        return "Stay completed";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Bookings</h1>
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
          <div className="space-y-4">
            {myBookings.map(({ booking, villa }) => (
              <Link key={booking.id} href={`/bookings/${booking.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Home className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold">
                            {villa?.name || "Unknown Villa"}
                          </h2>
                          <p className="text-muted-foreground text-sm mt-1">
                            {format(new Date(booking.checkIn), "MMM d, yyyy")} -{" "}
                            {format(new Date(booking.checkOut), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(booking.status)}>
                        {booking.status.charAt(0).toUpperCase() +
                          booking.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {getStatusMessage(booking.status)}
                      </p>
                      <p className="font-semibold">
                        ${Number(booking.totalPrice).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { db, villas, bookings, users } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Mail,
  CreditCard,
} from "lucide-react";
import { HostBookingActions } from "./HostBookingActions";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function HostBookingDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.email || !session.user.isHost) {
    redirect("/login");
  }

  const { id } = await params;

  // Get booking with villa and guest info
  const [result] = await db
    .select({
      booking: bookings,
      villa: villas,
      guest: users,
    })
    .from(bookings)
    .leftJoin(villas, eq(bookings.villaId, villas.id))
    .leftJoin(users, eq(bookings.userEmail, users.email))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!result) {
    notFound();
  }

  // Verify the host owns this villa
  if (result.villa?.ownerEmail !== session.user.email) {
    redirect("/host/bookings");
  }

  const { booking, villa, guest } = result;

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pending Payment",
      className: "bg-yellow-100 text-yellow-800",
    },
    paid: {
      label: "Paid - Awaiting Confirmation",
      className: "bg-blue-100 text-blue-800",
    },
    confirmed: {
      label: "Confirmed",
      className: "bg-green-100 text-green-800",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-red-100 text-red-800",
    },
    completed: {
      label: "Completed",
      className: "bg-gray-100 text-gray-800",
    },
  };

  const status = statusConfig[booking.status] || statusConfig.pending;

  const nights = Math.ceil(
    (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const getCryptoLabel = (crypto: string) => {
    switch (crypto) {
      case "btc":
        return "Bitcoin (BTC)";
      case "eth":
        return "Ethereum (ETH)";
      case "usdt_eth":
        return "USDT (ERC-20)";
      case "usdt_bsc":
        return "USDT (BEP-20)";
      default:
        return crypto;
    }
  };

  return (
    <div>
      <Link href="/host/bookings">
        <Button variant="ghost" className="mb-6 -ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to bookings
        </Button>
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{villa?.name}</CardTitle>
                  {villa?.location && (
                    <p className="text-muted-foreground mt-1 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {villa.location}
                    </p>
                  )}
                </div>
                <Badge className={status.className}>{status.label}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Check-in
                  </p>
                  <p className="font-medium">
                    {format(new Date(booking.checkIn), "EEE, MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Check-out
                  </p>
                  <p className="font-medium">
                    {format(new Date(booking.checkOut), "EEE, MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Guests
                  </p>
                  <p className="font-medium">{booking.guests ?? 1}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {nights} night{nights > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Guest Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{guest?.name || "Guest"}</p>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    {booking.userEmail}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total (USD)</span>
                <span className="font-medium">
                  ${Number(booking.totalPrice).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Crypto Amount</span>
                <span className="font-medium">
                  {booking.cryptoAmount} {getCryptoLabel(booking.cryptoCurrency)}
                </span>
              </div>
              {booking.txHash && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Transaction Hash
                    </p>
                    <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                      {booking.txHash}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Actions */}
        <div>
          <HostBookingActions
            bookingId={booking.id}
            status={booking.status}
            txHash={booking.txHash}
            villaName={villa?.name || "Villa"}
            adminNotes={booking.adminNotes}
          />
        </div>
      </div>
    </div>
  );
}

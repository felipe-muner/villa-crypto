import { auth } from "@/lib/auth";
import { db, bookings, villas, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { BookingActions } from "./BookingActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, ExternalLink } from "lucide-react";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminBookingDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.email || session.user.role !== "admin") {
    redirect("/login");
  }

  const { id } = await params;

  const [result] = await db
    .select({
      booking: bookings,
      villa: villas,
      user: users,
    })
    .from(bookings)
    .leftJoin(villas, eq(bookings.villaId, villas.id))
    .leftJoin(users, eq(bookings.userEmail, users.email))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!result) {
    notFound();
  }

  const { booking, villa, user } = result;

  const getCryptoLabel = (crypto: string) => {
    switch (crypto) {
      case "btc":
        return "Bitcoin (BTC)";
      case "eth":
        return "Ethereum (ETH)";
      case "usdt_eth":
        return "USDT on Ethereum";
      case "usdt_bsc":
        return "USDT on BSC";
      default:
        return crypto;
    }
  };

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

  const getBlockchainExplorer = () => {
    if (!booking.txHash) return null;
    switch (booking.cryptoCurrency) {
      case "btc":
        return `https://blockstream.info/tx/${booking.txHash}`;
      case "eth":
      case "usdt_eth":
        return `https://etherscan.io/tx/${booking.txHash}`;
      case "usdt_bsc":
        return `https://bscscan.com/tx/${booking.txHash}`;
      default:
        return null;
    }
  };

  const explorerUrl = getBlockchainExplorer();
  const decimals =
    booking.cryptoCurrency === "btc"
      ? 8
      : booking.cryptoCurrency === "eth"
      ? 6
      : 2;

  return (
    <div>
      <Link href="/admin/bookings">
        <Button variant="ghost" className="mb-6 -ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to bookings
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold">Booking Details</h1>
                  <p className="text-sm text-muted-foreground font-mono mt-1">
                    ID: {booking.id}
                  </p>
                </div>
                <Badge variant={getStatusVariant(booking.status)} className="text-sm">
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Badge>
              </div>

              <Separator className="my-4" />

              {/* Guest info */}
              <div className="mb-4">
                <h2 className="text-sm font-medium text-muted-foreground mb-2">
                  Guest Information
                </h2>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user?.avatar || undefined} alt={user?.name || "Guest"} />
                    <AvatarFallback>
                      {user?.name?.[0] || booking.userEmail[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user?.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{booking.userEmail}</p>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Villa info */}
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-2">
                  Villa
                </h2>
                <p className="font-medium">{villa?.name || "Unknown Villa"}</p>
                {villa?.location && (
                  <p className="text-sm text-muted-foreground">{villa.location}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stay details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stay Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Check-in</p>
                  <p className="font-medium">
                    {format(new Date(booking.checkIn), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-out</p>
                  <p className="font-medium">
                    {format(new Date(booking.checkOut), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Guests</p>
                  <p className="font-medium">{booking.guests}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(booking.createdAt), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total (USD)</span>
                <span className="font-medium">${Number(booking.totalPrice).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium">{getCryptoLabel(booking.cryptoCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Crypto Amount</span>
                <span className="font-bold text-lg">
                  {Number(booking.cryptoAmount).toFixed(decimals)}
                </span>
              </div>

              {/* Transaction hash */}
              {booking.txHash && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Transaction Hash
                    </p>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="font-mono text-sm break-all">{booking.txHash}</p>
                    </div>
                    {explorerUrl && (
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-sm text-primary hover:underline"
                      >
                        View on blockchain explorer
                        <ExternalLink className="ml-1 h-4 w-4" />
                      </a>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          <BookingActions
            bookingId={booking.id}
            currentStatus={booking.status}
            adminNotes={booking.adminNotes || ""}
            hasTxHash={!!booking.txHash}
          />
        </div>
      </div>
    </div>
  );
}

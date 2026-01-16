import { auth } from "@/lib/auth";
import { db, bookings, villas, walletConfig } from "@/lib/db";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { PaymentSection } from "./PaymentSection";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function BookingDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { id } = await params;

  const [result] = await db
    .select({
      booking: bookings,
      villa: villas,
    })
    .from(bookings)
    .leftJoin(villas, eq(bookings.villaId, villas.id))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!result) {
    notFound();
  }

  const isOwner = result.booking.userEmail === session.user.email;
  const isAdmin = session.user.role === "admin";

  if (!isOwner && !isAdmin) {
    redirect("/bookings");
  }

  const { booking, villa } = result;

  const [wallet] = await db.select().from(walletConfig).limit(1);

  let walletAddress = "";
  if (wallet) {
    switch (booking.cryptoCurrency) {
      case "btc":
        walletAddress = wallet.btcAddress || "";
        break;
      case "eth":
        walletAddress = wallet.ethAddress || "";
        break;
      case "usdt_eth":
        walletAddress = wallet.usdtEthAddress || "";
        break;
      case "usdt_bsc":
        walletAddress = wallet.usdtBscAddress || "";
        break;
    }
  }

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

  const decimals =
    booking.cryptoCurrency === "btc"
      ? 8
      : booking.cryptoCurrency === "eth"
      ? 6
      : 2;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link href="/bookings">
          <Button variant="ghost" className="mb-6 -ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to my bookings
          </Button>
        </Link>

        {/* Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{villa?.name || "Booking"}</h1>
                {villa?.location && (
                  <p className="text-muted-foreground mt-1 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {villa.location}
                  </p>
                )}
              </div>
              <Badge variant={getStatusVariant(booking.status)} className="text-sm">
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>

            <Separator className="my-4" />

            {/* Booking details */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Check-in
                </p>
                <p className="font-semibold">
                  {format(new Date(booking.checkIn), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Check-out
                </p>
                <p className="font-semibold">
                  {format(new Date(booking.checkOut), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Guests
                </p>
                <p className="font-semibold">{booking.guests}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Booking ID</p>
                <p className="font-mono text-sm">{booking.id.slice(0, 8)}...</p>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Price summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Total (USD)</span>
                <span className="font-semibold text-foreground">
                  ${Number(booking.totalPrice).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {getCryptoLabel(booking.cryptoCurrency)}
                </span>
                <span className="font-bold text-xl">
                  {Number(booking.cryptoAmount).toFixed(decimals)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment section - only show for pending status */}
        {booking.status === "pending" && (
          <PaymentSection
            bookingId={booking.id}
            walletAddress={walletAddress}
            cryptoCurrency={booking.cryptoCurrency}
            cryptoAmount={Number(booking.cryptoAmount)}
          />
        )}

        {/* Transaction info - show when tx hash exists */}
        {booking.txHash && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">
                  Transaction Hash
                </p>
                <p className="font-mono text-sm break-all">{booking.txHash}</p>
              </div>
              {booking.status === "paid" && (
                <p className="mt-4 text-sm text-blue-600 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Your payment has been received. The host will confirm your booking
                  shortly.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status messages */}
        {booking.status === "confirmed" && (
          <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-800 dark:text-green-300">
              Booking Confirmed!
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
              Your booking has been confirmed. We look forward to hosting you!
            </AlertDescription>
          </Alert>
        )}

        {booking.status === "cancelled" && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Booking Cancelled</AlertTitle>
            <AlertDescription>This booking has been cancelled.</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

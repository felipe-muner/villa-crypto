import { db, bookings, villas, users } from "@/lib/db";
import { desc, eq, asc } from "drizzle-orm";
import { format } from "date-fns";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, AlertCircle } from "lucide-react";
import { BookingProgressIndicator } from "@/components/BookingProgressIndicator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function BookingsPage() {
  const allBookings = await db
    .select({
      booking: bookings,
      villa: villas,
      user: users,
    })
    .from(bookings)
    .leftJoin(villas, eq(bookings.villaId, villas.id))
    .leftJoin(users, eq(bookings.userEmail, users.email))
    .orderBy(asc(villas.name), asc(bookings.checkIn));

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

  const getCryptoLabel = (crypto: string) => {
    switch (crypto) {
      case "btc":
        return "BTC";
      case "eth":
        return "ETH";
      case "usdt_eth":
        return "USDT (ETH)";
      case "usdt_bsc":
        return "USDT (BSC)";
      default:
        return crypto;
    }
  };

  // Get step number from status
  const getStatusStep = (status: string): number => {
    const steps: Record<string, number> = {
      pending: 1,
      paid: 2,
      confirmed: 3,
      completed: 4,
      cancelled: 0,
    };
    return steps[status] || 0;
  };

  // Count bookings needing payment confirmation
  const needsConfirmation = allBookings.filter(
    ({ booking }) => booking.status === "pending" && booking.txHash
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage booking requests and payments
        </p>
      </div>

      {/* Alert for bookings needing confirmation */}
      {needsConfirmation.length > 0 && (
        <Alert className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-800 dark:text-orange-300">
            <strong>{needsConfirmation.length} booking{needsConfirmation.length > 1 ? "s" : ""}</strong> with detected payment awaiting your confirmation.
          </AlertDescription>
        </Alert>
      )}

      {allBookings.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium">No bookings yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Bookings will appear here when guests make reservations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Villa</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allBookings.map(({ booking, villa, user }) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {user?.name || "Unknown"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {booking.userEmail}
                    </div>
                  </TableCell>
                  <TableCell>{villa?.name || "Unknown Villa"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <div>{format(new Date(booking.checkIn), "MMM d, yyyy")}</div>
                    <div className="text-xs">
                      to {format(new Date(booking.checkOut), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      ${Number(booking.totalPrice).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getCryptoLabel(booking.cryptoCurrency)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <BookingProgressIndicator
                      step={getStatusStep(booking.status)}
                      size="sm"
                      paymentDetected={booking.status === "pending" && !!booking.txHash}
                      cancelled={booking.status === "cancelled"}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">Booked:</span>{" "}
                      {format(new Date(booking.createdAt), "MMM d, HH:mm")}
                    </div>
                    {booking.txHash && booking.updatedAt && (
                      <div className={booking.status === "pending" ? "text-orange-600 font-medium" : ""}>
                        <span className="font-medium text-foreground">Payment:</span>{" "}
                        {format(new Date(booking.updatedAt), "MMM d, HH:mm")}
                        {booking.status === "pending" && " ⚠️"}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/bookings/${booking.id}`}>
                      <Button
                        variant={booking.status === "pending" && booking.txHash ? "default" : "ghost"}
                        size="sm"
                        className={booking.status === "pending" && booking.txHash ? "bg-orange-500 hover:bg-orange-600" : ""}
                      >
                        {booking.status === "pending" && booking.txHash ? "Confirm" : "View"}
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

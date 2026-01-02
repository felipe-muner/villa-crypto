import { db, bookings, villas, users } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
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
import { Calendar } from "lucide-react";

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage booking requests and payments
        </p>
      </div>

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
                <TableHead>Status</TableHead>
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
                    <Badge variant={getStatusVariant(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/bookings/${booking.id}`}>
                      <Button variant="ghost" size="sm">
                        View
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

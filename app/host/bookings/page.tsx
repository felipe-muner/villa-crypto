import { auth } from "@/lib/auth";
import { db, villas, bookings, users } from "@/lib/db";
import { eq, inArray, desc, and } from "drizzle-orm";
import type { BookingStatus } from "@/lib/types/database";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Home } from "lucide-react";
import { BookingActionButton } from "./BookingActionButton";
import { BookingProgressIndicator } from "@/components/BookingProgressIndicator";

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending Payment",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  },
  paid: {
    label: "Paid",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  },
  completed: {
    label: "Completed",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  },
};

function getStatusStep(status: string): number {
  const steps: Record<string, number> = {
    pending: 1,
    paid: 2,
    confirmed: 3,
    completed: 4,
    cancelled: 0,
  };
  return steps[status] || 0;
}

export default async function HostBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const userEmail = session?.user?.email;
  const { status: filterStatus } = await searchParams;

  if (!userEmail) {
    return null;
  }

  // Get host's villas
  const hostVillas = await db
    .select()
    .from(villas)
    .where(eq(villas.ownerEmail, userEmail));

  const villaIds = hostVillas.map((v) => v.id);

  if (villaIds.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View bookings for your properties
          </p>
        </div>
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No villas yet</h3>
          <p className="text-muted-foreground">
            Add a villa first to start receiving bookings.
          </p>
        </div>
      </div>
    );
  }

  // Build query conditions
  const validStatuses: BookingStatus[] = ["pending", "paid", "confirmed", "cancelled", "completed"];
  let queryConditions = inArray(bookings.villaId, villaIds);
  if (filterStatus && validStatuses.includes(filterStatus as BookingStatus)) {
    queryConditions = and(queryConditions, eq(bookings.status, filterStatus as BookingStatus))!;
  }

  // Get bookings for host's villas
  const hostBookings = await db
    .select({
      booking: bookings,
      villa: villas,
      guest: users,
    })
    .from(bookings)
    .leftJoin(villas, eq(bookings.villaId, villas.id))
    .leftJoin(users, eq(bookings.userEmail, users.email))
    .where(queryConditions)
    .orderBy(desc(bookings.createdAt));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage bookings for your properties
        </p>
      </div>

      {/* Filter badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/host/bookings">
          <Badge
            variant={!filterStatus ? "default" : "outline"}
            className="cursor-pointer"
          >
            All
          </Badge>
        </Link>
        {Object.entries(statusConfig).map(([key, config]) => (
          <Link key={key} href={`/host/bookings?status=${key}`}>
            <Badge
              variant={filterStatus === key ? "default" : "outline"}
              className="cursor-pointer"
            >
              {config.label}
            </Badge>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {hostBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bookings found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Villa</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hostBookings.map(({ booking, villa, guest }) => {
                  const status = statusConfig[booking.status] || statusConfig.pending;
                  const step = getStatusStep(booking.status);
                  const hasPaymentDetected = booking.status === "pending" && !!booking.txHash;

                  return (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <Link
                          href={`/host/bookings/${booking.id}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {villa?.name || "Unknown"}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {guest?.name || "Guest"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {booking.userEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {format(new Date(booking.checkIn), "MMM d")} -{" "}
                          {format(new Date(booking.checkOut), "MMM d, yyyy")}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.className}>
                          {status.label}
                        </Badge>
                        {hasPaymentDetected && (
                          <Badge className="ml-2 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                            Payment Detected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <BookingProgressIndicator
                          step={step}
                          size="sm"
                          paymentDetected={hasPaymentDetected}
                          cancelled={booking.status === "cancelled"}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            ${Number(booking.totalPrice).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground uppercase">
                            {booking.cryptoAmount}{" "}
                            {booking.cryptoCurrency?.replace("_", " ")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <BookingActionButton
                          bookingId={booking.id}
                          status={booking.status}
                          hasTxHash={!!booking.txHash}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

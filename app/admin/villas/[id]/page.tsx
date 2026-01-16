"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  ArrowLeft,
  Edit,
  Bed,
  Bath,
  Users,
  MapPin,
  DollarSign,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import type { Villa, Booking, User } from "@/lib/types/database";

interface BookingWithUser {
  booking: Booking;
  user: User | null;
}

export default function VillaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [villa, setVilla] = useState<Villa | null>(null);
  const [bookings, setBookings] = useState<BookingWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch villa
        const villaRes = await fetch(`/api/villas/${id}`);
        if (!villaRes.ok) {
          throw new Error("Villa not found");
        }
        const villaData = await villaRes.json();
        setVilla(villaData);

        // Fetch bookings for this villa
        const bookingsRes = await fetch(`/api/bookings?villaId=${id}`);
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setBookings(bookingsData);
        }
      } catch (err) {
        setError("Failed to load villa");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "paid":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate stats
  const totalRevenue = bookings
    .filter(
      (b) =>
        b.booking.status === "confirmed" || b.booking.status === "completed"
    )
    .reduce((sum, b) => sum + Number(b.booking.totalPrice), 0);

  const activeBookings = bookings.filter(
    (b) =>
      b.booking.status === "pending" ||
      b.booking.status === "paid" ||
      b.booking.status === "confirmed"
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !villa) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error || "Villa not found"}</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/villas">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{villa.name}</h1>
            <p className="text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {villa.location || "No location"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={villa.isActive ? "default" : "secondary"}>
            {villa.isActive ? "Active" : "Inactive"}
          </Badge>
          <Button asChild>
            <Link href={`/admin/villas/${id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Villa
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Bookings</p>
                <p className="text-xl font-bold">{activeBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price/Night</p>
                <p className="text-xl font-bold">${villa.pricePerNight}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Max Guests</p>
                <p className="text-xl font-bold">{villa.maxGuests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Villa Info + Image */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Villa Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-muted-foreground" />
                <span>{villa.bedrooms} Bedrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="h-4 w-4 text-muted-foreground" />
                <span>{villa.bathrooms} Bathrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Up to {villa.maxGuests} guests</span>
              </div>
            </div>

            {villa.description && (
              <p className="text-muted-foreground">{villa.description}</p>
            )}

            {villa.amenities && villa.amenities.length > 0 && (
              <div>
                <p className="font-medium mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {villa.amenities.map((amenity, i) => (
                    <Badge key={i} variant="outline">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {villa.images && villa.images.length > 0 ? (
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image
                  src={villa.images[0]}
                  alt={villa.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Availability Calendar */}
      <AvailabilityCalendar villaId={id} />

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
          <CardDescription>
            All bookings for this villa ({bookings.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No bookings yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map(({ booking, user }) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {user?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.userEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.checkIn), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.checkOut), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{booking.guests}</TableCell>
                    <TableCell>${booking.totalPrice}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/bookings/${booking.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

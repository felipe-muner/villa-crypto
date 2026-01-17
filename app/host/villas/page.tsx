import { auth } from "@/lib/auth";
import { db, villas } from "@/lib/db";
import { eq } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Home, MapPin, Users, Bed, Bath, Edit } from "lucide-react";
import { BlockedDatesManager } from "@/components/BlockedDatesManager";

export default async function HostVillasPage() {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return null;
  }

  const hostVillas = await db
    .select()
    .from(villas)
    .where(eq(villas.ownerEmail, userEmail));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Villas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your property listings
          </p>
        </div>
        <Link href="/host/villas/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Villa
          </Button>
        </Link>
      </div>

      {hostVillas.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No villas yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your first property to start accepting bookings.
          </p>
          <Link href="/host/villas/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Villa
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hostVillas.map((villa) => {
            const images = (villa.images as string[]) || [];
            const mainImage = images[0] || "/placeholder-villa.jpg";

            return (
              <Card key={villa.id} className="overflow-hidden">
                <div className="relative h-48">
                  <Image
                    src={mainImage}
                    alt={villa.name}
                    fill
                    className="object-cover"
                  />
                  <Badge
                    className={`absolute top-3 right-3 ${
                      villa.isActive
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  >
                    {villa.isActive ? "Available" : "Unavailable"}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{villa.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    {villa.location}
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {villa.maxGuests} guests
                    </span>
                    <span className="flex items-center">
                      <Bed className="h-4 w-4 mr-1" />
                      {villa.bedrooms} beds
                    </span>
                    <span className="flex items-center">
                      <Bath className="h-4 w-4 mr-1" />
                      {villa.bathrooms} baths
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">
                      ${Number(villa.pricePerNight).toFixed(0)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /night
                      </span>
                    </p>
                    <div className="flex gap-2">
                      <BlockedDatesManager villaId={villa.id} villaName={villa.name} />
                      <Link href={`/host/villas/${villa.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

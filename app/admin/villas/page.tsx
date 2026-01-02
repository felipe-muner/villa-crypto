import { db, villas } from "@/lib/db";
import { desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { DeleteVillaButton } from "./components/DeleteVillaButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Home, ImageIcon } from "lucide-react";

export default async function VillasPage() {
  const allVillas = await db
    .select()
    .from(villas)
    .orderBy(desc(villas.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Villas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your property listings
          </p>
        </div>
        <Link href="/admin/villas/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Villa
          </Button>
        </Link>
      </div>

      {allVillas.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Home className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium">No villas</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating a new villa.
            </p>
            <div className="mt-6">
              <Link href="/admin/villas/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Villa
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Villa</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price/Night</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allVillas.map((villa) => (
                <TableRow key={villa.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {villa.images && villa.images.length > 0 ? (
                          <Image
                            src={villa.images[0]}
                            alt={villa.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium">{villa.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {villa.bedrooms} bed · {villa.bathrooms} bath · up to{" "}
                          {villa.maxGuests} guests
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {villa.location || "-"}
                  </TableCell>
                  <TableCell>${Number(villa.pricePerNight).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={villa.isActive ? "default" : "secondary"}>
                      {villa.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/villas/${villa.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <DeleteVillaButton villaId={villa.id} villaName={villa.name} />
                    </div>
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

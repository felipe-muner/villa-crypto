import { auth } from "@/lib/auth";
import { db, villas } from "@/lib/db";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Plus } from "lucide-react";
import { HostStatsDashboard } from "./components/HostStatsDashboard";

export const dynamic = "force-dynamic";

export default async function HostDashboard() {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return null;
  }

  // Get host's villas
  const hostVillas = await db
    .select()
    .from(villas)
    .where(eq(villas.ownerEmail, userEmail));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Host Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back! Here&apos;s an overview of your revenue and bookings.
        </p>
      </div>

      {hostVillas.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No villas yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first property listing.
          </p>
          <Link href="/host/villas/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Villa
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Link href="/host/villas">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 rounded-md p-2 text-white">
                      <Home className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{hostVillas.length}</p>
                      <p className="text-xs text-muted-foreground">My Villas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/host/villas/new">
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-2">
                      <Plus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium">Add Villa</p>
                      <p className="text-xs text-muted-foreground">New property</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Revenue Dashboard with Date Filters */}
          <HostStatsDashboard />
        </>
      )}
    </div>
  );
}

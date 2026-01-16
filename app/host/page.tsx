import { auth } from "@/lib/auth";
import { db, villas, bookings } from "@/lib/db";
import { count, eq, and, inArray } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Calendar, Clock, CheckCircle, Plus } from "lucide-react";

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

  const villaIds = hostVillas.map((v) => v.id);

  // Get booking stats for host's villas
  let bookingCount = 0;
  let pendingCount = 0;
  let confirmedCount = 0;

  if (villaIds.length > 0) {
    const [bookingResult] = await db
      .select({ count: count() })
      .from(bookings)
      .where(inArray(bookings.villaId, villaIds));
    bookingCount = bookingResult.count;

    const [pendingResult] = await db
      .select({ count: count() })
      .from(bookings)
      .where(
        and(inArray(bookings.villaId, villaIds), eq(bookings.status, "pending"))
      );
    pendingCount = pendingResult.count;

    const [confirmedResult] = await db
      .select({ count: count() })
      .from(bookings)
      .where(
        and(
          inArray(bookings.villaId, villaIds),
          eq(bookings.status, "confirmed")
        )
      );
    confirmedCount = confirmedResult.count;
  }

  const stats = [
    {
      name: "My Villas",
      value: hostVillas.length,
      href: "/host/villas",
      icon: Home,
      color: "bg-blue-500",
    },
    {
      name: "Total Bookings",
      value: bookingCount,
      href: "/host/bookings",
      icon: Calendar,
      color: "bg-green-500",
    },
    {
      name: "Pending Payments",
      value: pendingCount,
      href: "/host/bookings?status=pending",
      icon: Clock,
      color: "bg-yellow-500",
    },
    {
      name: "Confirmed",
      value: confirmedCount,
      href: "/host/bookings?status=confirmed",
      icon: CheckCircle,
      color: "bg-purple-500",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Host Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back! Here&apos;s an overview of your villas and bookings.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.name} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div
                      className={`flex-shrink-0 ${stat.color} rounded-md p-3 text-white`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-muted-foreground truncate">
                          {stat.name}
                        </dt>
                        <dd className="text-2xl font-semibold">{stat.value}</dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/host/villas/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-lg p-3">
                    <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">Add New Villa</p>
                    <p className="text-sm text-muted-foreground">
                      List a new property
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/host/bookings?status=pending">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-yellow-100 dark:bg-yellow-900 rounded-lg p-3">
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-medium">Pending Bookings</p>
                    <p className="text-sm text-muted-foreground">
                      Review awaiting payments
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                    <Home className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium">View as Guest</p>
                    <p className="text-sm text-muted-foreground">
                      Browse villas as a guest
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {hostVillas.length === 0 && (
        <div className="mt-8 text-center py-12 bg-muted/50 rounded-lg">
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
      )}
    </div>
  );
}

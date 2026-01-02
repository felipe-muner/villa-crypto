import { db, villas, bookings } from "@/lib/db";
import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Home,
  Calendar,
  Clock,
  CheckCircle,
  Plus,
  Wallet,
} from "lucide-react";

export default async function AdminDashboard() {
  const [villaCount] = await db.select({ count: count() }).from(villas);
  const [bookingCount] = await db.select({ count: count() }).from(bookings);
  const [pendingCount] = await db
    .select({ count: count() })
    .from(bookings)
    .where(eq(bookings.status, "pending"));
  const [paidCount] = await db
    .select({ count: count() })
    .from(bookings)
    .where(eq(bookings.status, "paid"));

  const stats = [
    {
      name: "Total Villas",
      value: villaCount.count,
      href: "/admin/villas",
      icon: Home,
      color: "bg-blue-500",
    },
    {
      name: "Total Bookings",
      value: bookingCount.count,
      href: "/admin/bookings",
      icon: Calendar,
      color: "bg-green-500",
    },
    {
      name: "Pending Bookings",
      value: pendingCount.count,
      href: "/admin/bookings?status=pending",
      icon: Clock,
      color: "bg-yellow-500",
    },
    {
      name: "Paid (Awaiting Confirm)",
      value: paidCount.count,
      href: "/admin/bookings?status=paid",
      icon: CheckCircle,
      color: "bg-purple-500",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your villa booking system
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
                        <dd className="text-2xl font-semibold">
                          {stat.value}
                        </dd>
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
          <Link href="/admin/villas/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-lg p-3">
                    <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">Add New Villa</p>
                    <p className="text-sm text-muted-foreground">
                      Create a new property listing
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/bookings?status=paid">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 rounded-lg p-3">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">Review Payments</p>
                    <p className="text-sm text-muted-foreground">
                      Confirm paid bookings
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/settings">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900 rounded-lg p-3">
                    <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium">Wallet Settings</p>
                    <p className="text-sm text-muted-foreground">
                      Configure crypto addresses
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

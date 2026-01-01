import { db, villas, bookings } from "@/lib/db";
import { count, eq } from "drizzle-orm";
import Link from "next/link";

export default async function AdminDashboard() {
  // Get counts
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
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      color: "bg-blue-500",
    },
    {
      name: "Total Bookings",
      value: bookingCount.count,
      href: "/admin/bookings",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      color: "bg-green-500",
    },
    {
      name: "Pending Bookings",
      value: pendingCount.count,
      href: "/admin/bookings?status=pending",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "bg-yellow-500",
    },
    {
      name: "Paid (Awaiting Confirm)",
      value: paidCount.count,
      href: "/admin/bookings?status=paid",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "bg-purple-500",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of your villa booking system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div
                  className={`flex-shrink-0 ${stat.color} rounded-md p-3 text-white`}
                >
                  {stat.icon}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/villas/new"
            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-lg p-3">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Add New Villa
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create a new property listing
              </p>
            </div>
          </Link>

          <Link
            href="/admin/bookings?status=paid"
            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 rounded-lg p-3">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Review Payments
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Confirm paid bookings
              </p>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900 rounded-lg p-3">
              <svg
                className="w-6 h-6 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Wallet Settings
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure crypto addresses
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

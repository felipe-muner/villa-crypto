"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateRangePicker } from "@/components/DateRangePicker";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  Home,
} from "lucide-react";
import Link from "next/link";
import {
  formatCurrency,
  formatSimple,
  parseDateRangePreset,
  toAPIDateString,
  nowUTC,
  startOfMonthUTC,
  endOfDayUTC,
} from "@/lib/date";

interface VillaStat {
  villaId: string;
  villaName: string;
  revenue: number;
  bookings: number;
  confirmedBookings: number;
  pendingBookings: number;
}

interface RecentBooking {
  id: string;
  villaName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface StatsData {
  totalRevenue: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  avgBookingValue: number;
  villaStats: VillaStat[];
  recentBookings: RecentBooking[];
  dateRange: {
    start: string;
    end: string;
  };
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
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

export function HostStatsDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState("thisMonth");
  const [startDate, setStartDate] = useState<Date>(startOfMonthUTC(nowUTC()));
  const [endDate, setEndDate] = useState<Date>(endOfDayUTC(nowUTC()));

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = "/api/host/stats";

      if (selectedPreset && selectedPreset !== "custom") {
        url += `?preset=${selectedPreset}`;
      } else {
        url += `?start=${toAPIDateString(startDate)}&end=${toAPIDateString(endDate)}`;
      }

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await res.json();
      setStats(data);

      // Update dates from response
      if (data.dateRange) {
        setStartDate(new Date(data.dateRange.start));
        setEndDate(new Date(data.dateRange.end));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [selectedPreset, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);

    if (preset !== "custom") {
      const range = parseDateRangePreset(preset);
      if (range) {
        setStartDate(range.start);
        setEndDate(range.end);
      }
    }
  };

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    setSelectedPreset("custom");
  };

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Revenue Overview</h2>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
          onPresetChange={handlePresetChange}
          selectedPreset={selectedPreset}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.totalRevenue || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Paid + confirmed bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">All bookings in period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {stats?.confirmedBookings || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Ready for check-in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.pendingBookings || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Villa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Revenue by Villa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !stats?.villaStats.length ? (
            <p className="text-center text-muted-foreground py-8">
              No villa data for this period
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Villa</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Confirmed</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.villaStats.map((villa) => (
                  <TableRow key={villa.villaId}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/host/villas/${villa.villaId}/edit`}
                        className="hover:underline"
                      >
                        {villa.villaName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(villa.revenue)}
                    </TableCell>
                    <TableCell className="text-right">{villa.bookings}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {villa.confirmedBookings}
                    </TableCell>
                    <TableCell className="text-right text-yellow-600">
                      {villa.pendingBookings}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total Row */}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(stats.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-right">{stats.totalBookings}</TableCell>
                  <TableCell className="text-right text-green-600">
                    {stats.confirmedBookings}
                  </TableCell>
                  <TableCell className="text-right text-yellow-600">
                    {stats.pendingBookings}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Average Booking Value */}
      {stats && stats.avgBookingValue > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Booking Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.avgBookingValue)}
            </div>
            <p className="text-xs text-muted-foreground">Per confirmed booking</p>
          </CardContent>
        </Card>
      )}

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Bookings</CardTitle>
            <Link
              href="/host/bookings"
              className="text-sm text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !stats?.recentBookings.length ? (
            <p className="text-center text-muted-foreground py-8">
              No recent bookings
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Villa</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentBookings.map((booking) => {
                  const status = statusConfig[booking.status] || statusConfig.pending;
                  return (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <Link
                          href={`/host/bookings/${booking.id}`}
                          className="font-medium hover:underline"
                        >
                          {booking.villaName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {booking.guestEmail}
                      </TableCell>
                      <TableCell>
                        {formatSimple(booking.checkIn, "MMM d")} -{" "}
                        {formatSimple(booking.checkOut, "MMM d")}
                      </TableCell>
                      <TableCell>
                        <Badge className={status.className}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(booking.totalPrice)}
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

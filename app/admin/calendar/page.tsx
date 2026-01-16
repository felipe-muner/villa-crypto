"use client";

import { useState, useEffect } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface VillaInfo {
  id: string;
  name: string;
}

interface DayData {
  date: string;
  dayOfMonth: number;
  dayOfWeek: string;
  villaAvailability: Record<
    string,
    { available: boolean; bookingId?: string; status?: string }
  >;
}

interface CalendarData {
  month: string;
  monthLabel: string;
  villas: VillaInfo[];
  days: DayData[];
}

export default function AdminCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCalendar() {
      setLoading(true);
      setError(null);

      try {
        const monthParam = format(currentMonth, "yyyy-MM");
        const response = await fetch(`/api/admin/calendar?month=${monthParam}`);

        if (!response.ok) {
          throw new Error("Failed to fetch calendar");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError("Failed to load calendar");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchCalendar();
  }, [currentMonth]);

  const goToPreviousMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const today = format(new Date(), "yyyy-MM-dd");

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "confirmed":
        return "bg-red-500";
      case "paid":
        return "bg-orange-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-red-500";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Availability Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of all villa bookings
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {data?.monthLabel || format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">{error}</div>
          ) : data ? (
            <>
              {/* Legend */}
              <div className="flex gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-green-500" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-red-500" />
                  <span>Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-orange-500" />
                  <span>Paid</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-yellow-500" />
                  <span>Pending</span>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-background z-10 border p-2 text-left min-w-[120px]">
                        Day
                      </th>
                      {data.villas.map((villa) => (
                        <th
                          key={villa.id}
                          className="border p-2 text-center min-w-[100px]"
                        >
                          <Link
                            href={`/admin/villas/${villa.id}`}
                            className="hover:underline text-sm"
                          >
                            {villa.name.length > 15
                              ? villa.name.substring(0, 15) + "..."
                              : villa.name}
                          </Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.days.map((day) => {
                      const isToday = day.date === today;
                      const isPast = day.date < today;

                      return (
                        <tr
                          key={day.date}
                          className={cn(
                            isToday && "bg-blue-50 dark:bg-blue-950",
                            isPast && "opacity-60"
                          )}
                        >
                          <td
                            className={cn(
                              "sticky left-0 bg-background z-10 border p-2 font-medium",
                              isToday && "bg-blue-50 dark:bg-blue-950"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-xs w-8">
                                {day.dayOfWeek}
                              </span>
                              <span>{day.dayOfMonth}</span>
                              {isToday && (
                                <span className="text-xs text-blue-600 font-normal">
                                  (today)
                                </span>
                              )}
                            </div>
                          </td>
                          {data.villas.map((villa) => {
                            const availability =
                              day.villaAvailability[villa.id];
                            return (
                              <td
                                key={villa.id}
                                className="border p-1 text-center"
                              >
                                {availability?.available ? (
                                  <div className="h-8 rounded bg-green-100 dark:bg-green-900/30" />
                                ) : (
                                  <Link
                                    href={`/admin/bookings/${availability?.bookingId}`}
                                  >
                                    <div
                                      className={cn(
                                        "h-8 rounded cursor-pointer hover:opacity-80",
                                        getStatusColor(availability?.status)
                                      )}
                                      title={`${availability?.status} - Click to view`}
                                    />
                                  </Link>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

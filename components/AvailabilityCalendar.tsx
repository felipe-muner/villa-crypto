"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

interface DayAvailability {
  date: string;
  dayOfMonth: number;
  dayOfWeek: string;
  available: boolean;
  bookingId?: string;
  bookingStatus?: string;
}

interface AvailabilityData {
  villaId: string;
  villaName: string;
  month: string;
  monthLabel: string;
  days: DayAvailability[];
  totalDays: number;
  availableDays: number;
  bookedDays: number;
}

interface AvailabilityCalendarProps {
  villaId: string;
  initialMonth?: Date;
}

export function AvailabilityCalendar({
  villaId,
  initialMonth,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth || new Date());
  const [data, setData] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAvailability() {
      setLoading(true);
      setError(null);

      try {
        const monthParam = format(currentMonth, "yyyy-MM");
        const response = await fetch(
          `/api/villas/${villaId}/availability?month=${monthParam}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch availability");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError("Failed to load availability");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAvailability();
  }, [villaId, currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Availability Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center font-medium">
              {data?.monthLabel || format(currentMonth, "MMMM yyyy")}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">{error}</div>
        ) : data ? (
          <>
            {/* Stats */}
            <div className="flex gap-4 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-green-500" />
                <span>Available ({data.availableDays})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-red-500" />
                <span>Booked ({data.bookedDays})</span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-1 min-w-max">
                {data.days.map((day) => {
                  const isToday = day.date === today;
                  const isPast = day.date < today;

                  return (
                    <div
                      key={day.date}
                      className={cn(
                        "flex flex-col items-center justify-center w-10 h-14 rounded-md text-xs transition-colors",
                        day.available
                          ? isPast
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-400"
                            : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                          : isPast
                            ? "bg-gray-200 dark:bg-gray-700 text-gray-500"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50",
                        isToday && "ring-2 ring-blue-500 ring-offset-1"
                      )}
                      title={
                        day.available
                          ? `${day.date} - Available`
                          : `${day.date} - Booked (${day.bookingStatus})`
                      }
                    >
                      <span className="text-[10px] text-muted-foreground">
                        {day.dayOfWeek}
                      </span>
                      <span className="font-medium">{day.dayOfMonth}</span>
                      {!day.available && (
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full mt-0.5",
                            day.bookingStatus === "confirmed"
                              ? "bg-red-500"
                              : day.bookingStatus === "paid"
                                ? "bg-orange-500"
                                : "bg-yellow-500"
                          )}
                          title={day.bookingStatus}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend for booking status */}
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Confirmed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Paid</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Pending</span>
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useCallback } from "react";
import { format, addMonths, subMonths, startOfDay, isSameDay, isAfter, isBefore, eachDayOfInterval } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Ban, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import { trpc } from "@/lib/trpc/client";

interface BlockedDatesManagerProps {
  villaId: string;
  villaName: string;
}

interface DayInfo {
  date: Date;
  dateStr: string;
  dayOfMonth: number;
  dayOfWeek: string;
  isBooked: boolean;
  isBlocked: boolean;
  blockedId?: string;
  bookingId?: string;
  isPast: boolean;
  isToday: boolean;
}

export function BlockedDatesManager({ villaId, villaName }: BlockedDatesManagerProps) {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);
  const [reason, setReason] = useState("");

  const utils = trpc.useUtils();

  const monthStr = format(currentMonth, "yyyy-MM");

  // Fetch availability data (includes bookings and blocked dates)
  const { data: availabilityData, isLoading } = trpc.host.blockedDates.list.useQuery(
    { villaId, startDate: `${monthStr}-01`, endDate: format(addMonths(currentMonth, 1), "yyyy-MM-dd") },
    { enabled: open }
  );

  // Separate query for bookings in this month (we need this for the calendar display)
  const { data: bookingsData } = trpc.booking.list.useQuery(
    { villaId },
    { enabled: open }
  );

  const addBlockedMutation = trpc.host.blockedDates.add.useMutation({
    onSuccess: () => {
      showToast.success("Dates Blocked", "The selected dates have been blocked");
      utils.host.blockedDates.list.invalidate({ villaId });
      setSelectionStart(null);
      setSelectionEnd(null);
      setReason("");
    },
    onError: (error) => {
      showToast.error(error.message);
    },
  });

  const removeBlockedMutation = trpc.host.blockedDates.remove.useMutation({
    onSuccess: () => {
      showToast.success("Block Removed", "The dates are now available");
      utils.host.blockedDates.list.invalidate({ villaId });
    },
    onError: (error) => {
      showToast.error(error.message);
    },
  });

  const goToPreviousMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const today = startOfDay(new Date());

  // Build calendar days with booking and blocked info
  const getDaysInMonth = useCallback((): DayInfo[] => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const days = eachDayOfInterval({ start, end });

    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayStart = startOfDay(day);

      // Check if booked
      const booking = bookingsData?.find((b) => {
        if (b.booking.villaId !== villaId) return false;
        if (!["pending", "paid", "confirmed"].includes(b.booking.status)) return false;
        const checkIn = startOfDay(new Date(b.booking.checkIn));
        const checkOut = startOfDay(new Date(b.booking.checkOut));
        return dayStart >= checkIn && dayStart < checkOut;
      });

      // Check if blocked
      const blocked = availabilityData?.find((b) => {
        const blockStart = startOfDay(new Date(b.startDate));
        const blockEnd = startOfDay(new Date(b.endDate));
        return dayStart >= blockStart && dayStart <= blockEnd;
      });

      return {
        date: day,
        dateStr,
        dayOfMonth: day.getDate(),
        dayOfWeek: format(day, "EEE"),
        isBooked: !!booking,
        isBlocked: !!blocked,
        blockedId: blocked?.id,
        bookingId: booking?.booking.id,
        isPast: isBefore(dayStart, today),
        isToday: isSameDay(dayStart, today),
      };
    });
  }, [currentMonth, bookingsData, availabilityData, villaId, today]);

  const days = getDaysInMonth();

  const handleDayClick = (day: DayInfo) => {
    if (day.isPast || day.isBooked) return;

    // If clicking on a blocked day, show option to unblock
    if (day.isBlocked && day.blockedId) {
      if (confirm("Remove this block?")) {
        removeBlockedMutation.mutate({ id: day.blockedId });
      }
      return;
    }

    // Selection logic
    if (!selectionStart || (selectionStart && selectionEnd)) {
      // Start new selection
      setSelectionStart(day.date);
      setSelectionEnd(null);
    } else {
      // Complete selection
      if (isAfter(day.date, selectionStart)) {
        setSelectionEnd(day.date);
      } else {
        setSelectionEnd(selectionStart);
        setSelectionStart(day.date);
      }
    }
  };

  const isInSelection = (day: DayInfo): boolean => {
    if (!selectionStart) return false;
    if (!selectionEnd) return isSameDay(day.date, selectionStart);
    return day.date >= selectionStart && day.date <= selectionEnd;
  };

  const handleBlockDates = () => {
    if (!selectionStart) {
      showToast.error("Please select dates to block");
      return;
    }

    const startDate = format(selectionStart, "yyyy-MM-dd");
    const endDate = format(selectionEnd || selectionStart, "yyyy-MM-dd");

    addBlockedMutation.mutate({
      villaId,
      startDate,
      endDate,
      reason: reason || undefined,
    });
  };

  const clearSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-1" />
          Availability
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Availability - {villaName}</DialogTitle>
          <DialogDescription>
            Click on dates to block them. Click on blocked dates to unblock.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[140px] text-center font-medium">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border border-green-300" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30 border border-red-300" />
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-600 border border-gray-400" />
              <span>Blocked by you</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-900/50 border border-blue-400" />
              <span>Selected</span>
            </div>
          </div>

          {/* Calendar */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-xs text-muted-foreground py-2 font-medium">
                  {d}
                </div>
              ))}

              {/* Empty cells for alignment */}
              {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Days */}
              {days.map((day) => {
                const inSelection = isInSelection(day);
                const isSelectable = !day.isPast && !day.isBooked;

                return (
                  <button
                    key={day.dateStr}
                    onClick={() => handleDayClick(day)}
                    disabled={day.isPast || day.isBooked}
                    className={cn(
                      "aspect-square rounded-md text-sm font-medium transition-colors relative",
                      "flex flex-col items-center justify-center",
                      // Base states
                      day.isPast && "opacity-40 cursor-not-allowed",
                      day.isToday && "ring-2 ring-blue-500 ring-offset-1",
                      // Booked
                      day.isBooked && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 cursor-not-allowed",
                      // Blocked
                      !day.isBooked && day.isBlocked && "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500 cursor-pointer",
                      // Available
                      !day.isBooked && !day.isBlocked && !day.isPast && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer",
                      // Selected
                      inSelection && !day.isBooked && "bg-blue-200 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400"
                    )}
                  >
                    <span>{day.dayOfMonth}</span>
                    {day.isBlocked && !day.isBooked && (
                      <Ban className="h-3 w-3 absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Selection Actions */}
          {selectionStart && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Selected: {format(selectionStart, "MMM d")}
                  {selectionEnd && ` - ${format(selectionEnd, "MMM d")}`}
                </span>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Maintenance, Personal use..."
                />
              </div>

              <Button
                onClick={handleBlockDates}
                disabled={addBlockedMutation.isPending}
                className="w-full"
              >
                {addBlockedMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Blocking...
                  </>
                ) : (
                  <>
                    <Ban className="mr-2 h-4 w-4" />
                    Block Selected Dates
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Current Blocked Periods */}
          {availabilityData && availabilityData.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Blocked Periods</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {availabilityData.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between text-sm bg-muted rounded-lg px-3 py-2"
                  >
                    <div>
                      <span className="font-medium">
                        {format(new Date(block.startDate), "MMM d")} - {format(new Date(block.endDate), "MMM d, yyyy")}
                      </span>
                      {block.reason && (
                        <span className="text-muted-foreground ml-2">({block.reason})</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBlockedMutation.mutate({ id: block.id })}
                      disabled={removeBlockedMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

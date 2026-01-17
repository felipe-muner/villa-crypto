"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

interface BookingActionButtonProps {
  bookingId: string;
  status: string;
  hasTxHash: boolean;
}

export function BookingActionButton({
  bookingId,
  status,
  hasTxHash,
}: BookingActionButtonProps) {
  const router = useRouter();

  const updateBookingMutation = trpc.booking.update.useMutation({
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      console.error("Action failed:", error);
    },
  });

  const handleAction = (newStatus: string) => {
    updateBookingMutation.mutate({
      id: bookingId,
      data: { status: newStatus as "pending" | "paid" | "confirmed" | "cancelled" | "completed" },
    });
  };

  const loading = updateBookingMutation.isPending;

  // Payment detected - show Confirm Payment button
  if (status === "pending" && hasTxHash) {
    return (
      <Button
        size="sm"
        onClick={() => handleAction("paid")}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <CheckCircle className="h-4 w-4 mr-1" />
            Confirm Payment
          </>
        )}
      </Button>
    );
  }

  // Paid - show Confirm Booking button
  if (status === "paid") {
    return (
      <Button
        size="sm"
        onClick={() => handleAction("confirmed")}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <CheckCircle className="h-4 w-4 mr-1" />
            Confirm Booking
          </>
        )}
      </Button>
    );
  }

  // Other statuses - show View button
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => router.push(`/host/bookings/${bookingId}`)}
    >
      <Eye className="h-4 w-4 mr-1" />
      View
    </Button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Eye } from "lucide-react";

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
  const [loading, setLoading] = useState(false);

  const handleAction = async (newStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setLoading(false);
    }
  };

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

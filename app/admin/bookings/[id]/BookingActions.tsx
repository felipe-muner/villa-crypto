"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Check, X, AlertCircle } from "lucide-react";

interface VerificationResult {
  valid: boolean;
  confirmed: boolean;
  confirmations: number;
  amountReceived: number;
  recipientMatched: boolean;
  error?: string;
}

interface BookingActionsProps {
  bookingId: string;
  currentStatus: string;
  adminNotes: string;
  hasTxHash: boolean;
}

export function BookingActions({
  bookingId,
  currentStatus,
  adminNotes: initialNotes,
  hasTxHash,
}: BookingActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState(initialNotes);
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const updateBooking = async (data: Record<string, unknown>) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to update booking");
      }

      router.refresh();
      setShowConfirmDialog(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setShowConfirmDialog(newStatus);
  };

  const confirmStatusChange = () => {
    if (showConfirmDialog) {
      updateBooking({ status: showConfirmDialog });
    }
  };

  const saveNotes = () => {
    updateBooking({ adminNotes: notes });
  };

  const verifyBlockchainTx = async () => {
    setVerifying(true);
    setError("");
    setVerificationResult(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/verify`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to verify transaction");
      }

      setVerificationResult(data.verification);
      if (data.bookingStatus !== currentStatus) {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const getAvailableActions = () => {
    const actions: { status: string; label: string; variant: "default" | "destructive" | "secondary" }[] = [];

    switch (currentStatus) {
      case "pending":
        actions.push({
          status: "cancelled",
          label: "Cancel Booking",
          variant: "destructive",
        });
        break;
      case "paid":
        actions.push({
          status: "confirmed",
          label: "Confirm Booking",
          variant: "default",
        });
        actions.push({
          status: "cancelled",
          label: "Cancel Booking",
          variant: "destructive",
        });
        break;
      case "confirmed":
        actions.push({
          status: "completed",
          label: "Mark as Completed",
          variant: "secondary",
        });
        actions.push({
          status: "cancelled",
          label: "Cancel Booking",
          variant: "destructive",
        });
        break;
    }

    return actions;
  };

  const actions = getAvailableActions();

  return (
    <>
      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {actions.length > 0 ? (
            <div className="space-y-3">
              {actions.map((action) => (
                <Button
                  key={action.status}
                  onClick={() => handleStatusChange(action.status)}
                  disabled={loading}
                  variant={action.variant}
                  className="w-full"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No actions available for this booking status.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Verification Card */}
      {hasTxHash && (currentStatus === "pending" || currentStatus === "paid") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Blockchain Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={verifyBlockchainTx}
              disabled={verifying}
              className="w-full"
              variant="secondary"
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Transaction"
              )}
            </Button>

            {verificationResult && (
              <Alert
                className={`mt-4 ${
                  verificationResult.valid
                    ? "border-green-500 bg-green-50 dark:bg-green-950"
                    : "border-red-500 bg-red-50 dark:bg-red-950"
                }`}
              >
                <div className="flex items-center mb-2">
                  {verificationResult.valid ? (
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <X className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span
                    className={`font-medium ${
                      verificationResult.valid
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    }`}
                  >
                    {verificationResult.valid ? "Valid Transaction" : "Invalid Transaction"}
                  </span>
                </div>
                <AlertDescription className="space-y-1">
                  <p className="text-muted-foreground">
                    Confirmed: {verificationResult.confirmed ? "Yes" : "No"}
                  </p>
                  <p className="text-muted-foreground">
                    Confirmations: {verificationResult.confirmations}
                  </p>
                  <p className="text-muted-foreground">
                    Amount received: {verificationResult.amountReceived}
                  </p>
                  {verificationResult.error && (
                    <p className="text-destructive mt-2">{verificationResult.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin Notes Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Admin Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Add internal notes about this booking..."
            className="resize-none"
          />
          <Button
            onClick={saveNotes}
            disabled={loading || notes === initialNotes}
            className="mt-3 w-full"
          >
            Save Notes
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!showConfirmDialog} onOpenChange={() => setShowConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {showConfirmDialog === "confirmed"
                ? "confirm"
                : showConfirmDialog === "completed"
                ? "mark as completed"
                : "cancel"}{" "}
              this booking?
              {showConfirmDialog === "cancelled" && (
                <span className="block mt-2 text-destructive text-sm">
                  This action cannot be undone.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={loading}
              className={
                showConfirmDialog === "cancelled"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

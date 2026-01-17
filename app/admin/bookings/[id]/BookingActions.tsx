"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Check, X } from "lucide-react";
import { showToast } from "@/lib/toast";

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
  const [notes, setNotes] = useState(initialNotes);
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [manualTxHash, setManualTxHash] = useState("");
  const [assigningPayment, setAssigningPayment] = useState(false);

  const updateBooking = async (data: Record<string, unknown>, successMessage?: string) => {
    setLoading(true);

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

      if (successMessage) {
        showToast.success("Success", successMessage);
      }
      router.refresh();
      setShowConfirmDialog(null);
    } catch (err) {
      showToast.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setShowConfirmDialog(newStatus);
  };

  const confirmStatusChange = () => {
    if (showConfirmDialog) {
      const messages: Record<string, string> = {
        paid: "Payment confirmed",
        confirmed: "Booking confirmed",
        completed: "Booking marked as completed",
        cancelled: "Booking cancelled",
      };
      updateBooking({ status: showConfirmDialog }, messages[showConfirmDialog]);
    }
  };

  const saveNotes = () => {
    updateBooking({ adminNotes: notes }, "Notes saved");
  };

  const assignPaymentManually = async () => {
    if (!manualTxHash.trim()) {
      showToast.error("Please enter a transaction hash");
      return;
    }

    setAssigningPayment(true);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: manualTxHash.trim(), status: "paid" }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to assign payment");
      }

      showToast.success("Success", "Payment assigned successfully");
      setManualTxHash("");
      router.refresh();
    } catch (err) {
      showToast.error(err);
    } finally {
      setAssigningPayment(false);
    }
  };

  const verifyBlockchainTx = async () => {
    setVerifying(true);
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
      if (data.verification.valid) {
        showToast.success("Verified", "Transaction verified successfully");
      }
      if (data.bookingStatus !== currentStatus) {
        router.refresh();
      }
    } catch (err) {
      showToast.error(err);
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

      {/* Payment Detected - Confirm Payment */}
      {hasTxHash && currentStatus === "pending" && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-lg text-green-700 dark:text-green-300">
              Payment Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700 dark:text-green-300 mb-4">
              A matching payment has been detected on the blockchain.
              Review the transaction details and confirm to mark as paid.
            </p>
            <Button
              onClick={() => handleStatusChange("paid")}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirm Payment
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Manual Payment Assignment - for pending bookings without txHash */}
      {!hasTxHash && currentStatus === "pending" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Manual Payment Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              If auto-detection failed, you can manually enter the transaction hash.
            </p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="txHash">Transaction Hash</Label>
                <Input
                  id="txHash"
                  value={manualTxHash}
                  onChange={(e) => setManualTxHash(e.target.value)}
                  placeholder="0x..."
                  className="font-mono text-sm"
                />
              </div>
              <Button
                onClick={assignPaymentManually}
                disabled={assigningPayment || !manualTxHash.trim()}
                className="w-full"
              >
                {assigningPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Transaction"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              <div
                className={`mt-4 rounded-lg border-2 p-4 ${
                  verificationResult.valid
                    ? "border-green-500 bg-green-50 dark:bg-green-950"
                    : "border-red-500 bg-red-50 dark:bg-red-950"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {verificationResult.valid ? (
                    <Check className="h-6 w-6 text-green-500" />
                  ) : (
                    <X className="h-6 w-6 text-red-500" />
                  )}
                  <span
                    className={`font-semibold text-lg ${
                      verificationResult.valid
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    }`}
                  >
                    {verificationResult.valid ? "Valid Transaction" : "Invalid Transaction"}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-green-200 dark:border-green-800">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-medium ${verificationResult.confirmed ? "text-green-600" : "text-yellow-600"}`}>
                      {verificationResult.confirmed ? "Confirmed" : "Pending"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-green-200 dark:border-green-800">
                    <span className="text-muted-foreground">Confirmations</span>
                    <span className="font-mono font-medium">{verificationResult.confirmations}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">Amount Received</span>
                    <span className="font-mono font-bold text-base">{verificationResult.amountReceived} USDT</span>
                  </div>
                </div>

                {verificationResult.error && (
                  <p className="text-red-600 mt-3 text-sm">{verificationResult.error}</p>
                )}
              </div>
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
                : showConfirmDialog === "paid"
                ? "confirm payment for"
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

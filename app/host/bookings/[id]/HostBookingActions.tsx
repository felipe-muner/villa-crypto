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
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Clock,
  Banknote,
  Check,
  X,
} from "lucide-react";
import { showToast } from "@/lib/toast";

interface VerificationResult {
  valid: boolean;
  confirmed: boolean;
  confirmations: number;
  amountReceived: number;
  recipientMatched: boolean;
  error?: string;
}

interface HostBookingActionsProps {
  bookingId: string;
  status: string;
  txHash: string | null;
  villaName: string;
  adminNotes?: string | null;
}

export function HostBookingActions({
  bookingId,
  status,
  txHash,
  adminNotes: initialNotes,
}: HostBookingActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [manualTxHash, setManualTxHash] = useState("");
  const [assigningPayment, setAssigningPayment] = useState(false);
  const [notes, setNotes] = useState(initialNotes || "");
  const [savingNotes, setSavingNotes] = useState(false);

  const updateBooking = async (data: Record<string, unknown>, successMessage?: string) => {
    setLoading(true);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
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
      if (data.bookingStatus !== status) {
        router.refresh();
      }
    } catch (err) {
      showToast.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const assignPaymentManually = async () => {
    if (!manualTxHash.trim()) {
      showToast.error("Please enter a transaction hash");
      return;
    }

    setAssigningPayment(true);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: manualTxHash.trim(), status: "paid" }),
      });

      if (!res.ok) {
        const result = await res.json();
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

  const saveNotes = async () => {
    setSavingNotes(true);

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to save notes");
      }

      showToast.saved("Notes");
      router.refresh();
    } catch (err) {
      showToast.error(err);
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pending - waiting for payment */}
          {status === "pending" && !txHash && (
            <div className="text-center py-4">
              <Clock className="h-12 w-12 mx-auto text-yellow-500 mb-3" />
              <p className="font-medium">Waiting for Payment</p>
              <p className="text-sm text-muted-foreground mt-1">
                The guest hasn&apos;t paid yet.
              </p>
            </div>
          )}

          {/* Pending with txHash - payment detected, needs confirmation */}
          {status === "pending" && txHash && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <Banknote className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <p className="font-medium text-green-700">Payment Detected!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Review and confirm the payment.
                </p>
              </div>
              <Button
                onClick={() => handleStatusChange("paid")}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Confirm Payment
              </Button>
            </div>
          )}

          {/* Paid - needs booking confirmation */}
          {status === "paid" && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <AlertTriangle className="h-12 w-12 mx-auto text-blue-500 mb-3" />
                <p className="font-medium text-blue-700">Payment Confirmed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Confirm the booking to notify the guest.
                </p>
              </div>
              <Button
                onClick={() => handleStatusChange("confirmed")}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Confirm Booking
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                This will send a confirmation email to the guest.
              </p>
            </div>
          )}

          {/* Confirmed */}
          {status === "confirmed" && (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
              <p className="font-medium text-green-700">Booking Confirmed</p>
              <p className="text-sm text-muted-foreground mt-1">
                The guest has been notified and is ready to check in.
              </p>
              <Button
                onClick={() => handleStatusChange("completed")}
                disabled={loading}
                variant="secondary"
                className="w-full mt-4"
              >
                Mark as Completed
              </Button>
            </div>
          )}

          {/* Cancelled */}
          {status === "cancelled" && (
            <div className="text-center py-4">
              <XCircle className="h-12 w-12 mx-auto text-red-500 mb-3" />
              <p className="font-medium text-red-700">Booking Cancelled</p>
            </div>
          )}

          {/* Completed */}
          {status === "completed" && (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 mx-auto text-gray-500 mb-3" />
              <p className="font-medium">Completed</p>
              <p className="text-sm text-muted-foreground mt-1">
                This booking has been completed.
              </p>
            </div>
          )}

          {/* Cancel button for pending/paid bookings */}
          {(status === "pending" || status === "paid") && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange("cancelled")}
              disabled={loading}
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Booking
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Manual Payment Assignment - for pending bookings without txHash */}
      {!txHash && status === "pending" && (
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

      {/* Blockchain Verification Card */}
      {txHash && (status === "pending" || status === "paid") && (
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

      {/* Notes Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
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
            disabled={savingNotes || notes === (initialNotes || "")}
            className="mt-3 w-full"
          >
            {savingNotes ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Notes"
            )}
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
              {showConfirmDialog === "paid"
                ? "confirm the payment for"
                : showConfirmDialog === "confirmed"
                ? "confirm"
                : showConfirmDialog === "completed"
                ? "mark as completed"
                : "cancel"}{" "}
              this booking?
              {showConfirmDialog === "confirmed" && (
                <span className="block mt-2 text-sm">
                  A confirmation email will be sent to the guest.
                </span>
              )}
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
    </div>
  );
}

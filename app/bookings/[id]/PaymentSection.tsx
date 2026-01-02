"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle,
} from "lucide-react";

interface PaymentSectionProps {
  bookingId: string;
  walletAddress: string;
  cryptoCurrency: string;
  cryptoAmount: number;
}

export function PaymentSection({
  bookingId,
  walletAddress,
  cryptoCurrency,
  cryptoAmount,
}: PaymentSectionProps) {
  const router = useRouter();
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"address" | "amount" | null>(null);
  const [paymentFound, setPaymentFound] = useState(false);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true);

  // Check if this is a USDT payment (automatic detection supported)
  const isUsdtPayment =
    cryptoCurrency === "usdt_eth" || cryptoCurrency === "usdt_bsc";

  const getCryptoLabel = () => {
    switch (cryptoCurrency) {
      case "btc":
        return "BTC";
      case "eth":
        return "ETH";
      case "usdt_eth":
        return "USDT (ERC-20)";
      case "usdt_bsc":
        return "USDT (BEP-20)";
      default:
        return cryptoCurrency;
    }
  };

  const getNetworkWarning = () => {
    switch (cryptoCurrency) {
      case "btc":
        return "Send only BTC to this address";
      case "eth":
        return "Send only ETH on Ethereum network";
      case "usdt_eth":
        return "Send only USDT (ERC-20) on Ethereum network";
      case "usdt_bsc":
        return "Send only USDT (BEP-20) on BSC/BNB Chain";
      default:
        return "";
    }
  };

  const copyToClipboard = async (text: string, type: "address" | "amount") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Auto-check for payment (USDT only)
  const checkPayment = useCallback(async () => {
    if (!isUsdtPayment || paymentFound) return;

    setChecking(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/check-payment`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.paid && data.txHash) {
        setPaymentFound(true);
        setAutoCheckEnabled(false);
        // Refresh the page to show updated status
        setTimeout(() => router.refresh(), 1500);
      }
    } catch (err) {
      console.error("Error checking payment:", err);
    } finally {
      setChecking(false);
    }
  }, [bookingId, isUsdtPayment, paymentFound, router]);

  // Poll for payment every 30 seconds for USDT
  useEffect(() => {
    if (!isUsdtPayment || !autoCheckEnabled || paymentFound) return;

    // Initial check after 10 seconds
    const initialTimeout = setTimeout(checkPayment, 10000);

    // Then check every 30 seconds
    const interval = setInterval(checkPayment, 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isUsdtPayment, autoCheckEnabled, paymentFound, checkPayment]);

  // Manual submission for BTC/ETH (tx hash required)
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!txHash.trim()) {
      setError("Please enter a transaction hash");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: txHash.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit transaction");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const decimals =
    cryptoCurrency === "btc" ? 8 : cryptoCurrency === "eth" ? 6 : 2;

  if (!walletAddress) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Payment Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Wallet address not configured. Please contact support.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (paymentFound) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Payment Detected</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-800 dark:text-green-300">
              Your payment has been detected and is being processed. The page
              will refresh shortly.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Payment Instructions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning */}
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-800 dark:text-orange-300">
            {getNetworkWarning()}. Sending the wrong token or using the wrong
            network may result in permanent loss of funds.
          </AlertDescription>
        </Alert>

        {/* Amount to send */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Amount to send</label>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-muted rounded-lg p-4">
              <p className="text-2xl font-bold font-mono">
                {cryptoAmount.toFixed(decimals)} {getCryptoLabel()}
              </p>
              {isUsdtPayment && (
                <p className="text-xs text-muted-foreground mt-1">
                  Send the exact amount for automatic detection
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                copyToClipboard(cryptoAmount.toFixed(decimals), "amount")
              }
            >
              {copied === "amount" ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Wallet address */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Send to this address
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-muted rounded-lg p-4 overflow-hidden">
              <p className="font-mono text-sm break-all">{walletAddress}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(walletAddress, "address")}
            >
              {copied === "address" ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Auto-detection status for USDT */}
        {isUsdtPayment && (
          <div className="space-y-4">
            <Alert>
              <RefreshCw
                className={`h-4 w-4 ${checking ? "animate-spin" : ""}`}
              />
              <AlertDescription>
                {checking
                  ? "Checking blockchain for your payment..."
                  : "We automatically detect payments. Send the exact amount above and wait for confirmation."}
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Checking every 30 seconds...
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={checkPayment}
                disabled={checking}
              >
                {checking ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Check Now
              </Button>
            </div>
          </div>
        )}

        {/* Manual tx hash form for BTC/ETH */}
        {!isUsdtPayment && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                After sending, paste your transaction hash below
              </label>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-3">
                <Input
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="0x..."
                  className="font-mono"
                />
                <Button type="submit" disabled={loading || !txHash.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2, Bitcoin, Coins, DollarSign } from "lucide-react";

interface WalletConfigFormProps {
  initialConfig: {
    btcAddress: string;
    ethAddress: string;
    usdtEthAddress: string;
    usdtBscAddress: string;
  };
}

export function WalletConfigForm({ initialConfig }: WalletConfigFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    btcAddress: initialConfig.btcAddress,
    ethAddress: initialConfig.ethAddress,
    usdtEthAddress: initialConfig.usdtEthAddress,
    usdtBscAddress: initialConfig.usdtBscAddress,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/wallet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      setMessage({ type: "success", text: "Wallet addresses saved successfully!" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Bitcoin */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <Bitcoin className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Bitcoin (BTC)</CardTitle>
              <CardDescription>Native Bitcoin address</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            value={formData.btcAddress}
            onChange={(e) => setFormData({ ...formData, btcAddress: e.target.value })}
            placeholder="bc1q... or 1... or 3..."
            className="font-mono"
          />
        </CardContent>
      </Card>

      {/* Ethereum */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Coins className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Ethereum (ETH)</CardTitle>
              <CardDescription>ETH address for receiving Ether</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            value={formData.ethAddress}
            onChange={(e) => setFormData({ ...formData, ethAddress: e.target.value })}
            placeholder="0x..."
            className="font-mono"
          />
        </CardContent>
      </Card>

      {/* USDT on Ethereum */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-lg">USDT (ERC-20)</CardTitle>
              <CardDescription>Tether on Ethereum network</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            value={formData.usdtEthAddress}
            onChange={(e) => setFormData({ ...formData, usdtEthAddress: e.target.value })}
            placeholder="0x..."
            className="font-mono"
          />
        </CardContent>
      </Card>

      {/* USDT on BSC */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <CardTitle className="text-lg">USDT (BEP-20)</CardTitle>
              <CardDescription>Tether on Binance Smart Chain</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            value={formData.usdtBscAddress}
            onChange={(e) => setFormData({ ...formData, usdtBscAddress: e.target.value })}
            placeholder="0x..."
            className="font-mono"
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Wallet Addresses"
          )}
        </Button>
      </div>
    </form>
  );
}

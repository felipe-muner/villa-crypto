"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Wallet, CheckCircle } from "lucide-react";
import { showToast } from "@/lib/toast";
import { trpc } from "@/lib/trpc/client";

export default function HostSettingsPage() {
  const [formData, setFormData] = useState({
    btcAddress: "",
    ethAddress: "",
    usdtEthAddress: "",
    usdtBscAddress: "",
  });

  const { data: settings, isLoading } = trpc.host.settings.get.useQuery();

  const updateWallets = trpc.host.settings.updateWallets.useMutation({
    onSuccess: () => {
      showToast.success("Saved", "Wallet addresses updated successfully");
    },
    onError: (error) => {
      showToast.error(error.message);
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        btcAddress: settings.btcAddress,
        ethAddress: settings.ethAddress,
        usdtEthAddress: settings.usdtEthAddress,
        usdtBscAddress: settings.usdtBscAddress,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateWallets.mutate(formData);
  };

  const getConfiguredCount = () => {
    let count = 0;
    if (formData.btcAddress) count++;
    if (formData.ethAddress) count++;
    if (formData.usdtEthAddress) count++;
    if (formData.usdtBscAddress) count++;
    return count;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your wallet addresses to receive payments from bookings
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Payment Wallets</CardTitle>
                <CardDescription>
                  Configure wallet addresses to receive crypto payments. Only payment methods with
                  configured addresses will be shown to guests when booking your villas.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">
                  {getConfiguredCount()} of 4 payment methods configured
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Guests will see only the payment options you have configured below.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="btcAddress">Bitcoin (BTC) Address</Label>
                <Input
                  id="btcAddress"
                  value={formData.btcAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, btcAddress: e.target.value })
                  }
                  placeholder="bc1q..."
                />
                <p className="text-xs text-muted-foreground">
                  Your Bitcoin wallet address for receiving BTC payments
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ethAddress">Ethereum (ETH) Address</Label>
                <Input
                  id="ethAddress"
                  value={formData.ethAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, ethAddress: e.target.value })
                  }
                  placeholder="0x..."
                />
                <p className="text-xs text-muted-foreground">
                  Your Ethereum wallet address for receiving ETH payments
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="usdtEthAddress">USDT (ERC-20) Address</Label>
                <Input
                  id="usdtEthAddress"
                  value={formData.usdtEthAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, usdtEthAddress: e.target.value })
                  }
                  placeholder="0x..."
                />
                <p className="text-xs text-muted-foreground">
                  Your Ethereum wallet address for receiving USDT on Ethereum network
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="usdtBscAddress">USDT (BEP-20) Address</Label>
                <Input
                  id="usdtBscAddress"
                  value={formData.usdtBscAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, usdtBscAddress: e.target.value })
                  }
                  placeholder="0x..."
                />
                <p className="text-xs text-muted-foreground">
                  Your BSC wallet address for receiving USDT on BNB Chain
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={updateWallets.isPending}>
                {updateWallets.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

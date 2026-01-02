import { db, walletConfig } from "@/lib/db";
import { eq } from "drizzle-orm";
import { WalletConfigForm } from "./components/WalletConfigForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const [config] = await db
    .select()
    .from(walletConfig)
    .where(eq(walletConfig.id, 1))
    .limit(1);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your crypto wallet addresses for receiving payments
        </p>
      </div>

      <WalletConfigForm
        initialConfig={{
          btcAddress: config?.btcAddress || "",
          ethAddress: config?.ethAddress || "",
          usdtEthAddress: config?.usdtEthAddress || "",
          usdtBscAddress: config?.usdtBscAddress || "",
        }}
      />
    </div>
  );
}

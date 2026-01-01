import { db, walletConfig } from "@/lib/db";
import { eq } from "drizzle-orm";
import { WalletConfigForm } from "./components/WalletConfigForm";

export default async function SettingsPage() {
  const [config] = await db
    .select()
    .from(walletConfig)
    .where(eq(walletConfig.id, 1))
    .limit(1);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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

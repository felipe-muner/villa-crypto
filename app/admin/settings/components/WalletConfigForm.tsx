"use client";

import { useState } from "react";

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
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Bitcoin */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h1c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-1v2h-2v-2H9v-2h4v-2h-4V9h4V7h-2z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Bitcoin (BTC)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Native Bitcoin address
            </p>
          </div>
        </div>
        <input
          type="text"
          value={formData.btcAddress}
          onChange={(e) => setFormData({ ...formData, btcAddress: e.target.value })}
          placeholder="bc1q... or 1... or 3..."
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white font-mono text-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Ethereum */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4 12l8 5 8-5-8-10zm0 15l-8-5 8 10 8-10-8 5z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Ethereum (ETH)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ETH address for receiving Ether
            </p>
          </div>
        </div>
        <input
          type="text"
          value={formData.ethAddress}
          onChange={(e) => setFormData({ ...formData, ethAddress: e.target.value })}
          placeholder="0x..."
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white font-mono text-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* USDT on Ethereum */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <span className="text-green-600 dark:text-green-400 font-bold text-sm">$</span>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              USDT (ERC-20)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tether on Ethereum network
            </p>
          </div>
        </div>
        <input
          type="text"
          value={formData.usdtEthAddress}
          onChange={(e) => setFormData({ ...formData, usdtEthAddress: e.target.value })}
          placeholder="0x..."
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white font-mono text-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* USDT on BSC */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
            <span className="text-yellow-600 dark:text-yellow-400 font-bold text-sm">$</span>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              USDT (BEP-20)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tether on Binance Smart Chain
            </p>
          </div>
        </div>
        <input
          type="text"
          value={formData.usdtBscAddress}
          onChange={(e) => setFormData({ ...formData, usdtBscAddress: e.target.value })}
          placeholder="0x..."
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white font-mono text-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save Wallet Addresses"}
        </button>
      </div>
    </form>
  );
}

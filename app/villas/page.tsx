import { Suspense } from "react";
import { VillaSearch } from "./VillaSearch";
import { Header } from "@/components/Header";

export const dynamic = "force-dynamic";

export default function VillasPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Luxury Villas
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Book with cryptocurrency - BTC, ETH, or USDT
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
          <VillaSearch />
        </Suspense>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bitcoin, Coins, Shield } from "lucide-react";
import { Header } from "@/components/Header";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">Villa Crypto</h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Book luxury villas with cryptocurrency. Pay with BTC, ETH, or USDT.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/villas">
              <Button size="lg" className="px-8">
                Browse Villas
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                <Bitcoin className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Pay with Bitcoin
              </h3>
              <p className="text-gray-400">
                Secure payments using the world&apos;s most trusted cryptocurrency.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <Coins className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Ethereum & USDT
              </h3>
              <p className="text-gray-400">
                Flexible payment options including ETH and stablecoins.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Verified Payments
              </h3>
              <p className="text-gray-400">
                Blockchain verification ensures secure and transparent transactions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

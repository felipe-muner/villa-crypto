import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Villa Crypto
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Book luxury villas with cryptocurrency. Pay with BTC, ETH, or USDT.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/admin"
              className="px-8 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Pay with Bitcoin</h3>
            <p className="text-gray-400">
              Secure payments using the world&apos;s most trusted cryptocurrency.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L4 12l8 5 8-5-8-10zm0 15l-8-5 8 10 8-10-8 5z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Ethereum & USDT</h3>
            <p className="text-gray-400">
              Flexible payment options including ETH and stablecoins.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Verified Payments</h3>
            <p className="text-gray-400">
              Blockchain verification ensures secure and transparent transactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

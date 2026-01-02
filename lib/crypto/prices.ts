// CoinGecko price conversion utility

interface CryptoPrice {
  bitcoin: { usd: number };
  ethereum: { usd: number };
  tether: { usd: number };
}

let cachedPrices: CryptoPrice | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCryptoPrices(): Promise<CryptoPrice> {
  const now = Date.now();

  if (cachedPrices && now - cacheTimestamp < CACHE_DURATION) {
    return cachedPrices;
  }

  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd",
      { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch prices");
    }

    cachedPrices = await response.json();
    cacheTimestamp = now;
    return cachedPrices!;
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
    // Return fallback prices if API fails
    return {
      bitcoin: { usd: 100000 },
      ethereum: { usd: 3500 },
      tether: { usd: 1 },
    };
  }
}

export async function convertUsdToCrypto(
  usdAmount: number,
  currency: "btc" | "eth" | "usdt_eth" | "usdt_bsc"
): Promise<number> {
  const prices = await getCryptoPrices();

  switch (currency) {
    case "btc":
      return usdAmount / prices.bitcoin.usd;
    case "eth":
      return usdAmount / prices.ethereum.usd;
    case "usdt_eth":
    case "usdt_bsc":
      return usdAmount; // USDT is 1:1 with USD
    default:
      return usdAmount;
  }
}

export function getCryptoDecimals(currency: string): number {
  switch (currency) {
    case "btc":
      return 8;
    case "eth":
      return 6;
    case "usdt_eth":
    case "usdt_bsc":
      return 2;
    default:
      return 2;
  }
}

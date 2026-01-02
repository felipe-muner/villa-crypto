import { NextResponse } from "next/server";
import { getCryptoPrices, convertUsdToCrypto, getCryptoDecimals } from "@/lib/crypto/prices";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const usdAmount = searchParams.get("amount");

    const prices = await getCryptoPrices();

    if (usdAmount) {
      const amount = parseFloat(usdAmount);
      const conversions = {
        btc: {
          amount: await convertUsdToCrypto(amount, "btc"),
          decimals: getCryptoDecimals("btc"),
          price: prices.bitcoin.usd,
        },
        eth: {
          amount: await convertUsdToCrypto(amount, "eth"),
          decimals: getCryptoDecimals("eth"),
          price: prices.ethereum.usd,
        },
        usdt: {
          amount: amount,
          decimals: getCryptoDecimals("usdt_eth"),
          price: 1,
        },
      };

      return NextResponse.json({
        usdAmount: amount,
        conversions,
        prices: {
          btc: prices.bitcoin.usd,
          eth: prices.ethereum.usd,
          usdt: 1,
        },
      });
    }

    return NextResponse.json({
      prices: {
        btc: prices.bitcoin.usd,
        eth: prices.ethereum.usd,
        usdt: 1,
      },
    });
  } catch (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}

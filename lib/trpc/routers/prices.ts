import { router, publicProcedure } from "../init";
import { priceQuerySchema } from "../schemas";
import { getCryptoPrices, convertUsdToCrypto, getCryptoDecimals } from "@/lib/crypto/prices";

export const pricesRouter = router({
  // Get crypto prices and optionally convert USD amount
  get: publicProcedure
    .input(priceQuerySchema.optional())
    .query(async ({ input }) => {
      const prices = await getCryptoPrices();

      if (input?.amount) {
        const amount = input.amount;
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

        return {
          usdAmount: amount,
          conversions,
          prices: {
            btc: prices.bitcoin.usd,
            eth: prices.ethereum.usd,
            usdt: 1,
          },
        };
      }

      return {
        prices: {
          btc: prices.bitcoin.usd,
          eth: prices.ethereum.usd,
          usdt: 1,
        },
      };
    }),
});

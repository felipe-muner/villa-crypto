// Blockchain verification utilities

export { verifyBtcTransaction } from "./verify-btc";
export type { BtcVerificationResult } from "./verify-btc";

export { verifyEthTransaction } from "./verify-eth";
export type { EthVerificationResult } from "./verify-eth";

export { verifyUsdtTransaction } from "./verify-usdt";
export type { UsdtVerificationResult } from "./verify-usdt";

export interface VerificationResult {
  valid: boolean;
  confirmed: boolean;
  confirmations: number;
  amountReceived: number;
  recipientMatched: boolean;
  error?: string;
}

export async function verifyTransaction(
  txHash: string,
  walletAddress: string,
  expectedAmount: number,
  cryptoCurrency: "btc" | "eth" | "usdt_eth" | "usdt_bsc"
): Promise<VerificationResult> {
  const { verifyBtcTransaction } = await import("./verify-btc");
  const { verifyEthTransaction } = await import("./verify-eth");
  const { verifyUsdtTransaction } = await import("./verify-usdt");

  switch (cryptoCurrency) {
    case "btc":
      return verifyBtcTransaction(txHash, walletAddress, expectedAmount);
    case "eth":
      return verifyEthTransaction(txHash, walletAddress, expectedAmount);
    case "usdt_eth":
      return verifyUsdtTransaction(txHash, walletAddress, expectedAmount, "eth");
    case "usdt_bsc":
      return verifyUsdtTransaction(txHash, walletAddress, expectedAmount, "bsc");
    default:
      return {
        valid: false,
        confirmed: false,
        confirmations: 0,
        amountReceived: 0,
        recipientMatched: false,
        error: "Unsupported cryptocurrency",
      };
  }
}

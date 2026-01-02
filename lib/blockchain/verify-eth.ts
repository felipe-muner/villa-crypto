// Ethereum transaction verification using ethers.js

import { JsonRpcProvider, formatEther } from "ethers";

export interface EthVerificationResult {
  valid: boolean;
  confirmed: boolean;
  confirmations: number;
  amountReceived: number; // in ETH
  recipientMatched: boolean;
  error?: string;
}

// Public Ethereum RPC endpoints
const ETH_RPC_URLS = [
  "https://eth.llamarpc.com",
  "https://rpc.ankr.com/eth",
  "https://ethereum.publicnode.com",
];

async function getProvider(): Promise<JsonRpcProvider> {
  for (const url of ETH_RPC_URLS) {
    try {
      const provider = new JsonRpcProvider(url);
      await provider.getBlockNumber(); // Test connection
      return provider;
    } catch {
      continue;
    }
  }
  throw new Error("Unable to connect to Ethereum network");
}

export async function verifyEthTransaction(
  txHash: string,
  expectedAddress: string,
  expectedAmount: number // in ETH
): Promise<EthVerificationResult> {
  try {
    const provider = await getProvider();

    // Get transaction
    const tx = await provider.getTransaction(txHash);

    if (!tx) {
      return {
        valid: false,
        confirmed: false,
        confirmations: 0,
        amountReceived: 0,
        recipientMatched: false,
        error: "Transaction not found",
      };
    }

    // Get transaction receipt for confirmation status
    const receipt = await provider.getTransactionReceipt(txHash);
    const currentBlock = await provider.getBlockNumber();

    const confirmations = receipt?.blockNumber
      ? currentBlock - receipt.blockNumber + 1
      : 0;

    // Check recipient address
    const recipientMatched =
      tx.to?.toLowerCase() === expectedAddress.toLowerCase();

    // Convert value to ETH
    const amountReceived = parseFloat(formatEther(tx.value));

    // Check if amount is sufficient (allow 0.1% tolerance)
    const amountValid = amountReceived >= expectedAmount * 0.999;

    // Check if transaction was successful
    const txSuccessful = receipt?.status === 1;

    return {
      valid: recipientMatched && amountValid && txSuccessful,
      confirmed: confirmations >= 1,
      confirmations,
      amountReceived,
      recipientMatched,
      error: !recipientMatched
        ? `Recipient mismatch: expected ${expectedAddress}, got ${tx.to}`
        : !amountValid
        ? `Insufficient amount: expected ${expectedAmount} ETH, received ${amountReceived} ETH`
        : !txSuccessful
        ? "Transaction failed"
        : undefined,
    };
  } catch (error) {
    return {
      valid: false,
      confirmed: false,
      confirmations: 0,
      amountReceived: 0,
      recipientMatched: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// USDT (ERC-20/BEP-20) transaction verification

import { JsonRpcProvider, Contract, formatUnits } from "ethers";

export interface UsdtVerificationResult {
  valid: boolean;
  confirmed: boolean;
  confirmations: number;
  amountReceived: number; // in USDT
  recipientMatched: boolean;
  error?: string;
}

// USDT Contract addresses
const USDT_CONTRACTS = {
  eth: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT on Ethereum
  bsc: "0x55d398326f99059fF775485246999027B3197955", // USDT on BSC
};

// RPC endpoints
const RPC_URLS = {
  eth: [
    "https://eth.llamarpc.com",
    "https://rpc.ankr.com/eth",
    "https://ethereum.publicnode.com",
  ],
  bsc: [
    "https://bsc-dataseed.binance.org",
    "https://rpc.ankr.com/bsc",
    "https://bsc.publicnode.com",
  ],
};

// ERC-20 Transfer event ABI
const TRANSFER_EVENT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

async function getProvider(
  network: "eth" | "bsc"
): Promise<JsonRpcProvider> {
  const urls = RPC_URLS[network];
  for (const url of urls) {
    try {
      const provider = new JsonRpcProvider(url);
      await provider.getBlockNumber();
      return provider;
    } catch {
      continue;
    }
  }
  throw new Error(`Unable to connect to ${network.toUpperCase()} network`);
}

export async function verifyUsdtTransaction(
  txHash: string,
  expectedAddress: string,
  expectedAmount: number, // in USDT
  network: "eth" | "bsc"
): Promise<UsdtVerificationResult> {
  try {
    const provider = await getProvider(network);
    const contractAddress = USDT_CONTRACTS[network];

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return {
        valid: false,
        confirmed: false,
        confirmations: 0,
        amountReceived: 0,
        recipientMatched: false,
        error: "Transaction not found or pending",
      };
    }

    // Check if transaction was successful
    if (receipt.status !== 1) {
      return {
        valid: false,
        confirmed: false,
        confirmations: 0,
        amountReceived: 0,
        recipientMatched: false,
        error: "Transaction failed",
      };
    }

    // Create contract interface to parse logs
    const contract = new Contract(contractAddress, TRANSFER_EVENT_ABI, provider);

    // Find Transfer event to the expected address
    let amountReceived = 0;
    let recipientMatched = false;

    for (const log of receipt.logs) {
      // Check if log is from USDT contract
      if (log.address.toLowerCase() !== contractAddress.toLowerCase()) {
        continue;
      }

      try {
        const parsed = contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });

        if (parsed && parsed.name === "Transfer") {
          const to = parsed.args[1] as string;
          const value = parsed.args[2] as bigint;

          if (to.toLowerCase() === expectedAddress.toLowerCase()) {
            recipientMatched = true;
            // USDT has 6 decimals on ETH, 18 on BSC
            const decimals = network === "eth" ? 6 : 18;
            amountReceived += parseFloat(formatUnits(value, decimals));
          }
        }
      } catch {
        // Not a Transfer event or parsing failed
        continue;
      }
    }

    // Get confirmations
    const currentBlock = await provider.getBlockNumber();
    const confirmations = receipt.blockNumber
      ? currentBlock - receipt.blockNumber + 1
      : 0;

    // Check if amount is sufficient (allow 0.1% tolerance)
    const amountValid = amountReceived >= expectedAmount * 0.999;

    return {
      valid: recipientMatched && amountValid,
      confirmed: confirmations >= 1,
      confirmations,
      amountReceived,
      recipientMatched,
      error: !recipientMatched
        ? "No USDT transfer found to the expected address"
        : !amountValid
        ? `Insufficient amount: expected ${expectedAmount} USDT, received ${amountReceived} USDT`
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

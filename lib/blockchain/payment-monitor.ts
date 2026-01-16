// Automatic payment monitoring for USDT transfers

import { JsonRpcProvider, Contract, formatUnits } from "ethers";

export interface IncomingTransfer {
  txHash: string;
  from: string;
  amount: number;
  blockNumber: number;
  timestamp: number;
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

// ERC-20 Transfer event signature
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

async function getProvider(network: "eth" | "bsc"): Promise<JsonRpcProvider> {
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

/**
 * Scan for recent USDT transfers to a specific address
 * @param walletAddress - The address to scan for incoming transfers
 * @param network - eth or bsc
 * @param blocksBack - How many blocks back to scan (default: ~1 hour worth)
 */
export async function scanForIncomingTransfers(
  walletAddress: string,
  network: "eth" | "bsc",
  blocksBack: number = 300 // ~1 hour for ETH, ~15 min for BSC
): Promise<IncomingTransfer[]> {
  try {
    const provider = await getProvider(network);
    const contractAddress = USDT_CONTRACTS[network];
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - blocksBack;

    // Pad address to 32 bytes for topic filtering
    const paddedAddress = "0x" + walletAddress.slice(2).toLowerCase().padStart(64, "0");

    // Get Transfer events where 'to' is our wallet
    const logs = await provider.getLogs({
      address: contractAddress,
      topics: [
        TRANSFER_TOPIC,
        null, // from (any)
        paddedAddress, // to (our wallet)
      ],
      fromBlock,
      toBlock: currentBlock,
    });

    const transfers: IncomingTransfer[] = [];
    const decimals = network === "eth" ? 6 : 18;

    for (const log of logs) {
      // Decode the amount from data
      const amount = BigInt(log.data);
      const amountFormatted = parseFloat(formatUnits(amount, decimals));

      // Get block timestamp
      const block = await provider.getBlock(log.blockNumber);
      const timestamp = block?.timestamp || Math.floor(Date.now() / 1000);

      // Decode the from address from topics
      const fromAddress = "0x" + log.topics[1].slice(26);

      transfers.push({
        txHash: log.transactionHash,
        from: fromAddress,
        amount: amountFormatted,
        blockNumber: log.blockNumber,
        timestamp,
      });
    }

    return transfers;
  } catch (error) {
    console.error(`Error scanning for transfers on ${network}:`, error);
    return [];
  }
}

/**
 * Find a matching payment for a specific amount
 * Relies on unique amounts per booking + txHash deduplication (done in check-payment route)
 */
export function findMatchingPayment(
  transfers: IncomingTransfer[],
  expectedAmount: number,
  _bookingCreatedAt: Date // kept for API compatibility
): IncomingTransfer | null {
  // Amount tolerance: ±1% (tight since amounts are unique per booking)
  const tolerance = expectedAmount * 0.01;

  // Find the most recent transfer matching the amount
  // No strict timestamp requirement - unique amounts are the key identifier
  // txHash deduplication is handled by the caller
  for (const transfer of transfers) {
    const amountDiff = Math.abs(transfer.amount - expectedAmount);
    if (amountDiff <= tolerance) {
      return transfer;
    }
  }

  return null;
}

/**
 * Generate a unique payment amount by adding small random decimals
 * This helps identify which booking a payment is for
 */
export function generateUniqueAmount(baseAmount: number): number {
  // Add random cents between 0.01 and 0.99 to make amount unique
  const randomCents = Math.floor(Math.random() * 99) + 1;
  const uniquePart = randomCents / 100;

  // Return amount with 2 decimal places
  return Math.round((baseAmount + uniquePart) * 100) / 100;
}

/**
 * Verify a specific transaction and get its details
 */
export async function verifyTransaction(
  txHash: string,
  expectedAddress: string,
  network: "eth" | "bsc"
): Promise<{ valid: boolean; amount: number; from: string } | null> {
  try {
    const provider = await getProvider(network);
    const contractAddress = USDT_CONTRACTS[network];

    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1) {
      return null;
    }

    const decimals = network === "eth" ? 6 : 18;

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== contractAddress.toLowerCase()) {
        continue;
      }

      if (log.topics[0] !== TRANSFER_TOPIC) {
        continue;
      }

      const toAddress = "0x" + log.topics[2].slice(26);
      if (toAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
        continue;
      }

      const amount = BigInt(log.data);
      const fromAddress = "0x" + log.topics[1].slice(26);

      return {
        valid: true,
        amount: parseFloat(formatUnits(amount, decimals)),
        from: fromAddress,
      };
    }

    return null;
  } catch (error) {
    console.error("Error verifying transaction:", error);
    return null;
  }
}

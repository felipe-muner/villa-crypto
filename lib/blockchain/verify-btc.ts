// Bitcoin transaction verification using Blockstream API

interface BlockstreamTx {
  txid: string;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_time?: number;
  };
  vout: Array<{
    scriptpubkey_address?: string;
    value: number; // in satoshis
  }>;
}

export interface BtcVerificationResult {
  valid: boolean;
  confirmed: boolean;
  confirmations: number;
  amountReceived: number; // in BTC
  recipientMatched: boolean;
  error?: string;
}

export async function verifyBtcTransaction(
  txHash: string,
  expectedAddress: string,
  expectedAmount: number // in BTC
): Promise<BtcVerificationResult> {
  try {
    // Fetch transaction from Blockstream API
    const response = await fetch(
      `https://blockstream.info/api/tx/${txHash}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          valid: false,
          confirmed: false,
          confirmations: 0,
          amountReceived: 0,
          recipientMatched: false,
          error: "Transaction not found",
        };
      }
      throw new Error(`API error: ${response.status}`);
    }

    const tx: BlockstreamTx = await response.json();

    // Find output matching the expected address
    const matchingOutput = tx.vout.find(
      (output) =>
        output.scriptpubkey_address?.toLowerCase() ===
        expectedAddress.toLowerCase()
    );

    const amountReceived = matchingOutput
      ? matchingOutput.value / 100_000_000 // Convert satoshis to BTC
      : 0;

    // Get current block height for confirmations
    let confirmations = 0;
    if (tx.status.confirmed && tx.status.block_height) {
      const tipResponse = await fetch(
        "https://blockstream.info/api/blocks/tip/height"
      );
      if (tipResponse.ok) {
        const currentHeight = parseInt(await tipResponse.text(), 10);
        confirmations = currentHeight - tx.status.block_height + 1;
      }
    }

    // Check if amount is sufficient (allow 0.1% tolerance for fee variations)
    const amountValid = amountReceived >= expectedAmount * 0.999;

    return {
      valid: !!matchingOutput && amountValid,
      confirmed: tx.status.confirmed,
      confirmations,
      amountReceived,
      recipientMatched: !!matchingOutput,
      error: !matchingOutput
        ? "Recipient address not found in transaction outputs"
        : !amountValid
        ? `Insufficient amount: expected ${expectedAmount} BTC, received ${amountReceived} BTC`
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

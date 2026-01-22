/**
 * Format Utilities
 *
 * Common formatting functions for currency, time, file sizes, and numbers
 */

/**
 * Format a number as currency
 *
 * @param amount - The amount to format
 * @param currency - Currency code (default: USD)
 * @param locale - Locale for formatting (default: en-US)
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format currency with flexible decimal places
 * Shows fewer decimals for whole numbers
 */
export function formatCurrencyCompact(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  const hasDecimals = amount % 1 !== 0;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format cryptocurrency amount with appropriate decimal places
 *
 * @param amount - Amount in crypto
 * @param symbol - Crypto symbol (BTC, ETH, USDT)
 */
export function formatCrypto(
  amount: number,
  symbol: string = "BTC"
): string {
  const decimals: Record<string, number> = {
    BTC: 8,
    ETH: 6,
    USDT: 2,
    USDC: 2,
  };

  const maxDecimals = decimals[symbol.toUpperCase()] || 8;

  // Remove trailing zeros
  const formatted = amount.toFixed(maxDecimals).replace(/\.?0+$/, "");

  return `${formatted} ${symbol.toUpperCase()}`;
}

/**
 * Format time duration in human readable format
 *
 * @param seconds - Duration in seconds
 * @param options - Formatting options
 */
export function formatTime(
  seconds: number,
  options: {
    showSeconds?: boolean;
    padZeros?: boolean;
    verbose?: boolean;
  } = {}
): string {
  const { showSeconds = true, padZeros = true, verbose = false } = options;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (verbose) {
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
    if (showSeconds && (secs > 0 || parts.length === 0)) {
      parts.push(`${secs} second${secs !== 1 ? "s" : ""}`);
    }
    return parts.join(", ");
  }

  const pad = (n: number) => (padZeros ? n.toString().padStart(2, "0") : n.toString());

  if (hours > 0) {
    return showSeconds
      ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
      : `${pad(hours)}:${pad(minutes)}`;
  }

  return showSeconds ? `${pad(minutes)}:${pad(secs)}` : `${minutes} min`;
}

/**
 * Format milliseconds to human readable time
 */
export function formatMilliseconds(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  return formatTime(Math.floor(ms / 1000));
}

/**
 * Format duration between two dates
 */
export function formatDuration(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  return formatTime(diffSecs, { verbose: true });
}

/**
 * Format file size in human readable format
 *
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @param binary - Use binary units (1024) instead of SI units (1000)
 */
export function formatFileSize(
  bytes: number,
  decimals: number = 2,
  binary: boolean = true
): string {
  if (bytes === 0) return "0 Bytes";
  if (bytes < 0) return "Invalid size";

  const k = binary ? 1024 : 1000;
  const sizes = binary
    ? ["Bytes", "KB", "MB", "GB", "TB", "PB"]
    : ["Bytes", "kB", "MB", "GB", "TB", "PB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  return `${size.toFixed(decimals)} ${sizes[i]}`;
}

/**
 * Parse file size string back to bytes
 * "10 MB" -> 10485760
 */
export function parseFileSize(sizeStr: string): number {
  const units: Record<string, number> = {
    bytes: 1,
    b: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
    tb: 1024 ** 4,
    pb: 1024 ** 5,
  };

  const match = sizeStr.toLowerCase().match(/^([\d.]+)\s*(\w+)$/);
  if (!match) return 0;

  const [, value, unit] = match;
  const multiplier = units[unit] || 1;

  return parseFloat(value) * multiplier;
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(
  num: number,
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format a number in compact notation (1K, 1M, 1B)
 */
export function formatNumberCompact(
  num: number,
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
  }).format(num);
}

/**
 * Format a percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Format a decimal as percentage (0.15 -> "15%")
 */
export function formatDecimalAsPercent(
  decimal: number,
  decimals: number = 0
): string {
  return `${(decimal * 100).toFixed(decimals)}%`;
}

/**
 * Format ordinal number (1st, 2nd, 3rd, etc.)
 */
export function formatOrdinal(num: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const remainder = num % 100;

  if (remainder >= 11 && remainder <= 13) {
    return `${num}th`;
  }

  return `${num}${suffixes[num % 10] || suffixes[0]}`;
}

/**
 * Format phone number (US format)
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
}

/**
 * Format international phone number
 */
export function formatPhoneInternational(phone: string, countryCode: string = ""): string {
  const cleaned = phone.replace(/\D/g, "");

  if (countryCode) {
    return `+${countryCode} ${cleaned}`;
  }

  return cleaned;
}

/**
 * Format a list of items with proper grammar
 * ["a", "b", "c"] -> "a, b, and c"
 */
export function formatList(
  items: string[],
  conjunction: string = "and"
): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

  const allButLast = items.slice(0, -1).join(", ");
  return `${allButLast}, ${conjunction} ${items[items.length - 1]}`;
}

/**
 * Format bytes per second (bandwidth)
 */
export function formatBandwidth(bytesPerSecond: number): string {
  return `${formatFileSize(bytesPerSecond)}/s`;
}

/**
 * Format credit card number with spaces
 * "4111111111111111" -> "4111 1111 1111 1111"
 */
export function formatCreditCard(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, "");
  return cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/**
 * Mask credit card number
 * "4111111111111111" -> "**** **** **** 1111"
 */
export function maskCreditCard(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, "");
  if (cleaned.length < 4) return cardNumber;

  const lastFour = cleaned.slice(-4);
  return `**** **** **** ${lastFour}`;
}

/**
 * Format a coordinate (latitude/longitude)
 */
export function formatCoordinate(
  value: number,
  type: "lat" | "lng",
  precision: number = 6
): string {
  const direction =
    type === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";

  return `${Math.abs(value).toFixed(precision)}${direction}`;
}

/**
 * Format coordinates as a pair
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${formatCoordinate(lat, "lat")}, ${formatCoordinate(lng, "lng")}`;
}

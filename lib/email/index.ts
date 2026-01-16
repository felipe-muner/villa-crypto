import { Resend } from "resend";
import { format } from "date-fns";
import type { Booking, Villa, CryptoCurrency } from "@/lib/types/database";
import { BookingConfirmationEmail } from "./templates/booking-confirmation";
import { PaymentReceivedEmail } from "./templates/payment-received";
import { BookingConfirmedEmail } from "./templates/booking-confirmed";

// Lazy-load Resend client to avoid build errors when API key is not set
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const FROM_EMAIL = process.env.EMAIL_FROM || "Villa Crypto <noreply@resend.dev>";

export function getCryptoLabel(crypto: CryptoCurrency): string {
  switch (crypto) {
    case "btc":
      return "Bitcoin (BTC)";
    case "eth":
      return "Ethereum (ETH)";
    case "usdt_eth":
      return "USDT (ERC-20)";
    case "usdt_bsc":
      return "USDT (BEP-20)";
    default:
      return crypto;
  }
}

export function getCryptoSymbol(crypto: CryptoCurrency): string {
  switch (crypto) {
    case "btc":
      return "BTC";
    case "eth":
      return "ETH";
    case "usdt_eth":
    case "usdt_bsc":
      return "USDT";
    default:
      return crypto;
  }
}

export function getNetworkWarning(crypto: CryptoCurrency): string | null {
  switch (crypto) {
    case "btc":
      return "Send only Bitcoin (BTC) to this address";
    case "eth":
      return "Send only Ethereum (ETH) to this address";
    case "usdt_eth":
      return "Send only USDT (ERC-20) on Ethereum network. Do NOT send on other networks.";
    case "usdt_bsc":
      return "Send only USDT (BEP-20) on BSC/BNB Chain. Do NOT send on other networks.";
    default:
      return null;
  }
}

interface SendBookingConfirmationParams {
  to: string;
  booking: Booking;
  villa: Villa;
  walletAddress: string;
}

export async function sendBookingConfirmationEmail({
  to,
  booking,
  villa,
  walletAddress,
}: SendBookingConfirmationParams) {
  try {
    const { data, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Booking Confirmation - ${villa.name}`,
      html: BookingConfirmationEmail({
        villaName: villa.name,
        villaLocation: villa.location || "Location not specified",
        checkIn: format(new Date(booking.checkIn), "EEEE, MMMM d, yyyy"),
        checkOut: format(new Date(booking.checkOut), "EEEE, MMMM d, yyyy"),
        guests: booking.guests ?? 1,
        totalPriceUsd: booking.totalPrice,
        cryptoAmount: booking.cryptoAmount || "0",
        cryptoCurrency: getCryptoLabel(booking.cryptoCurrency),
        cryptoSymbol: getCryptoSymbol(booking.cryptoCurrency),
        walletAddress,
        networkWarning: getNetworkWarning(booking.cryptoCurrency),
        bookingId: booking.id,
      }),
    });

    if (error) {
      console.error("Failed to send booking confirmation email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    return { success: false, error };
  }
}

interface SendPaymentReceivedParams {
  to: string;
  booking: Booking;
  villa: Villa;
  txHash: string;
}

export async function sendPaymentReceivedEmail({
  to,
  booking,
  villa,
  txHash,
}: SendPaymentReceivedParams) {
  try {
    const { data, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Payment Received - ${villa.name}`,
      html: PaymentReceivedEmail({
        villaName: villa.name,
        checkIn: format(new Date(booking.checkIn), "EEEE, MMMM d, yyyy"),
        checkOut: format(new Date(booking.checkOut), "EEEE, MMMM d, yyyy"),
        cryptoAmount: booking.cryptoAmount || "0",
        cryptoSymbol: getCryptoSymbol(booking.cryptoCurrency),
        txHash,
        bookingId: booking.id,
      }),
    });

    if (error) {
      console.error("Failed to send payment received email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending payment received email:", error);
    return { success: false, error };
  }
}

interface SendBookingConfirmedParams {
  to: string;
  booking: Booking;
  villa: Villa;
}

export async function sendBookingConfirmedEmail({
  to,
  booking,
  villa,
}: SendBookingConfirmedParams) {
  try {
    const { data, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Booking Confirmed! - ${villa.name}`,
      html: BookingConfirmedEmail({
        villaName: villa.name,
        villaLocation: villa.location || "Location not specified",
        villaImage: villa.images?.[0] || null,
        checkIn: format(new Date(booking.checkIn), "EEEE, MMMM d, yyyy"),
        checkOut: format(new Date(booking.checkOut), "EEEE, MMMM d, yyyy"),
        guests: booking.guests ?? 1,
        bookingId: booking.id,
      }),
    });

    if (error) {
      console.error("Failed to send booking confirmed email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending booking confirmed email:", error);
    return { success: false, error };
  }
}

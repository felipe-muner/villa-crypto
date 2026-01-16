import { Resend } from "resend";
import { BookingConfirmationEmail } from "../lib/email/templates/booking-confirmation";
import { PaymentReceivedEmail } from "../lib/email/templates/payment-received";
import { BookingConfirmedEmail } from "../lib/email/templates/booking-confirmed";

const resend = new Resend(process.env.RESEND_API_KEY);

const TO_EMAIL = "felipe.muner@gmail.com";
const FROM_EMAIL = "Villa Crypto <onboarding@resend.dev>";

async function sendTestEmails() {
  console.log("Sending test emails to:", TO_EMAIL);

  // 1. Booking Confirmation Email
  console.log("\n1. Sending Booking Confirmation Email...");
  const { data: data1, error: error1 } = await resend.emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    subject: "Test - Booking Confirmation - Luxury Beach Villa",
    html: BookingConfirmationEmail({
      villaName: "Luxury Beach Villa",
      villaLocation: "Koh Phangan, Thailand",
      checkIn: "Saturday, February 15, 2025",
      checkOut: "Saturday, February 22, 2025",
      guests: 4,
      totalPriceUsd: "2100.00",
      cryptoAmount: "2100.45",
      cryptoCurrency: "USDT (BEP-20)",
      cryptoSymbol: "USDT",
      walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
      networkWarning: "Send only USDT (BEP-20) on BSC/BNB Chain. Do NOT send on other networks.",
      bookingId: "test-booking-123",
    }),
  });

  if (error1) {
    console.error("Error:", error1);
  } else {
    console.log("✅ Sent! ID:", data1?.id);
  }

  // 2. Payment Received Email
  console.log("\n2. Sending Payment Received Email...");
  const { data: data2, error: error2 } = await resend.emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    subject: "Test - Payment Received - Luxury Beach Villa",
    html: PaymentReceivedEmail({
      villaName: "Luxury Beach Villa",
      checkIn: "Saturday, February 15, 2025",
      checkOut: "Saturday, February 22, 2025",
      cryptoAmount: "2100.45",
      cryptoSymbol: "USDT",
      txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      bookingId: "test-booking-123",
    }),
  });

  if (error2) {
    console.error("Error:", error2);
  } else {
    console.log("✅ Sent! ID:", data2?.id);
  }

  // 3. Booking Confirmed Email
  console.log("\n3. Sending Booking Confirmed Email...");
  const { data: data3, error: error3 } = await resend.emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    subject: "Test - Booking Confirmed! - Luxury Beach Villa",
    html: BookingConfirmedEmail({
      villaName: "Luxury Beach Villa",
      villaLocation: "Koh Phangan, Thailand",
      villaImage: null,
      checkIn: "Saturday, February 15, 2025",
      checkOut: "Saturday, February 22, 2025",
      guests: 4,
      bookingId: "test-booking-123",
    }),
  });

  if (error3) {
    console.error("Error:", error3);
  } else {
    console.log("✅ Sent! ID:", data3?.id);
  }

  console.log("\n✅ Done! Check your inbox at", TO_EMAIL);
}

sendTestEmails().catch(console.error);

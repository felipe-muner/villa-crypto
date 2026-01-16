interface PaymentReceivedEmailProps {
  villaName: string;
  checkIn: string;
  checkOut: string;
  cryptoAmount: string;
  cryptoSymbol: string;
  txHash: string;
  bookingId: string;
}

export function PaymentReceivedEmail({
  villaName,
  checkIn,
  checkOut,
  cryptoAmount,
  cryptoSymbol,
  txHash,
  bookingId,
}: PaymentReceivedEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Success Banner -->
          <tr>
            <td style="background-color: #f0fdf4; padding: 24px 48px; text-align: center;">
              <p style="color: #16a34a; font-size: 48px; margin: 0 0 8px;">&#10003;</p>
              <h1 style="color: #166534; font-size: 24px; font-weight: 600; margin: 0;">Payment Received!</h1>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 24px 48px 16px;">
              <p style="color: #4b5563; font-size: 14px; line-height: 24px; margin: 0;">
                We have received your payment of <strong>${cryptoAmount} ${cryptoSymbol}</strong> for your booking at <strong>${villaName}</strong>.
              </p>
            </td>
          </tr>

          <!-- Booking Summary -->
          <tr>
            <td style="padding: 0 48px 24px;">
              <h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px;">Booking Summary</h2>
              <p style="color: #4b5563; font-size: 14px; margin: 0 0 8px;"><strong>Villa:</strong> ${villaName}</p>
              <p style="color: #4b5563; font-size: 14px; margin: 0 0 8px;"><strong>Check-in:</strong> ${checkIn}</p>
              <p style="color: #4b5563; font-size: 14px; margin: 0 0 8px;"><strong>Check-out:</strong> ${checkOut}</p>
              <p style="color: #4b5563; font-size: 14px; margin: 0;"><strong>Payment:</strong> ${cryptoAmount} ${cryptoSymbol}</p>
            </td>
          </tr>

          <!-- Transaction Hash -->
          <tr>
            <td style="padding: 0 48px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="color: #4b5563; font-size: 12px; font-weight: 600; margin: 0 0 8px;">Transaction Hash</p>
                    <p style="color: #1f2937; font-size: 11px; font-family: monospace; word-break: break-all; margin: 0;">${txHash}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 48px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="padding: 24px 48px;">
              <h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px;">What happens next?</h2>
              <p style="color: #4b5563; font-size: 14px; line-height: 24px; margin: 0;">
                Our team will verify your payment and confirm your booking. You will receive another email once your booking is confirmed with check-in instructions.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 48px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 48px;">
              <p style="color: #6b7280; font-size: 12px; line-height: 20px; margin: 0 0 8px;">Booking ID: ${bookingId}</p>
              <p style="color: #6b7280; font-size: 12px; line-height: 20px; margin: 0;">
                If you have any questions, please reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export default PaymentReceivedEmail;

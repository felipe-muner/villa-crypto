interface BookingConfirmationEmailProps {
  villaName: string;
  villaLocation: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPriceUsd: string;
  cryptoAmount: string;
  cryptoCurrency: string;
  cryptoSymbol: string;
  walletAddress: string;
  networkWarning: string | null;
  bookingId: string;
}

export function BookingConfirmationEmail({
  villaName,
  villaLocation,
  checkIn,
  checkOut,
  guests,
  totalPriceUsd,
  cryptoAmount,
  cryptoCurrency,
  cryptoSymbol,
  walletAddress,
  networkWarning,
  bookingId,
}: BookingConfirmationEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 48px 20px;">
              <h1 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 20px;">Booking Confirmation</h1>
              <p style="color: #4b5563; font-size: 14px; line-height: 24px; margin: 0;">
                Thank you for your booking! Please complete your payment to confirm your reservation.
              </p>
            </td>
          </tr>

          <!-- Reservation Details -->
          <tr>
            <td style="padding: 0 48px 24px;">
              <h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px;">Reservation Details</h2>
              <p style="color: #4b5563; font-size: 14px; margin: 0 0 8px;"><strong>Villa:</strong> ${villaName}</p>
              <p style="color: #4b5563; font-size: 14px; margin: 0 0 8px;"><strong>Location:</strong> ${villaLocation}</p>
              <p style="color: #4b5563; font-size: 14px; margin: 0 0 8px;"><strong>Check-in:</strong> ${checkIn}</p>
              <p style="color: #4b5563; font-size: 14px; margin: 0 0 8px;"><strong>Check-out:</strong> ${checkOut}</p>
              <p style="color: #4b5563; font-size: 14px; margin: 0 0 8px;"><strong>Guests:</strong> ${guests}</p>
              <p style="color: #4b5563; font-size: 14px; margin: 0;"><strong>Total:</strong> $${totalPriceUsd} USD</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 48px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
            </td>
          </tr>

          <!-- Payment Instructions -->
          <tr>
            <td style="padding: 24px 48px;">
              <h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px;">Payment Instructions</h2>
              <p style="color: #4b5563; font-size: 14px; line-height: 24px; margin: 0 0 16px;">
                Please send the exact amount below to complete your booking:
              </p>

              <!-- Amount Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 8px; margin-bottom: 16px;">
                <tr>
                  <td style="padding: 16px; text-align: center;">
                    <p style="color: #166534; font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 0 0 4px;">Amount to Send</p>
                    <p style="color: #15803d; font-size: 24px; font-weight: 700; margin: 0 0 4px;">${cryptoAmount} ${cryptoSymbol}</p>
                    <p style="color: #166534; font-size: 12px; margin: 0;">${cryptoCurrency}</p>
                  </td>
                </tr>
              </table>

              <!-- Wallet Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; border-radius: 8px; margin-bottom: 16px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="color: #4b5563; font-size: 12px; font-weight: 600; margin: 0 0 8px;">Send to this wallet address:</p>
                    <p style="color: #1f2937; font-size: 12px; font-family: monospace; word-break: break-all; margin: 0;">${walletAddress}</p>
                  </td>
                </tr>
              </table>

              ${networkWarning ? `
              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 8px;">
                <tr>
                  <td style="padding: 12px 16px;">
                    <p style="color: #92400e; font-size: 12px; font-weight: 500; margin: 0;">${networkWarning}</p>
                  </td>
                </tr>
              </table>
              ` : ''}
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
              <p style="color: #6b7280; font-size: 12px; line-height: 20px; margin: 0 0 8px;">
                Once we detect your payment, we will send you a confirmation email. For USDT payments, this is usually automatic. For BTC/ETH payments, you can submit your transaction hash on the booking page.
              </p>
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

export default BookingConfirmationEmail;

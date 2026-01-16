interface BookingConfirmedEmailProps {
  villaName: string;
  villaLocation: string;
  villaImage: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  bookingId: string;
}

export function BookingConfirmedEmail({
  villaName,
  villaLocation,
  villaImage,
  checkIn,
  checkOut,
  guests,
  bookingId,
}: BookingConfirmedEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Success Banner -->
          <tr>
            <td style="background-color: #166534; padding: 32px 48px; text-align: center;">
              <p style="color: #ffffff; font-size: 48px; margin: 0 0 8px;">&#10003;</p>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0 0 8px;">Booking Confirmed!</h1>
              <p style="color: #bbf7d0; font-size: 14px; margin: 0;">Your reservation has been confirmed. Get ready for your stay!</p>
            </td>
          </tr>

          ${villaImage ? `
          <!-- Villa Image -->
          <tr>
            <td style="padding: 0;">
              <img src="${villaImage}" alt="${villaName}" style="display: block; width: 100%; height: auto;">
            </td>
          </tr>
          ` : ''}

          <!-- Villa Info -->
          <tr>
            <td style="padding: 24px 48px;">
              <h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 8px;">${villaName}</h2>
              <p style="color: #6b7280; font-size: 14px; margin: 0;">${villaLocation}</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 48px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
            </td>
          </tr>

          <!-- Reservation Details -->
          <tr>
            <td style="padding: 24px 48px;">
              <h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px;">Reservation Details</h2>

              <!-- Check-in Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 12px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 0 0 4px;">Check-in</p>
                    <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 4px;">${checkIn}</p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">From 3:00 PM</p>
                  </td>
                </tr>
              </table>

              <!-- Check-out Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 16px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 0 0 4px;">Check-out</p>
                    <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 4px;">${checkOut}</p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">Until 11:00 AM</p>
                  </td>
                </tr>
              </table>

              <p style="color: #4b5563; font-size: 14px; margin: 0;"><strong>Guests:</strong> ${guests}</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 48px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
            </td>
          </tr>

          <!-- Important Information -->
          <tr>
            <td style="padding: 24px 48px;">
              <h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px;">Important Information</h2>
              <p style="color: #4b5563; font-size: 14px; line-height: 24px; margin: 0 0 8px;">- Check-in time is 3:00 PM, check-out time is 11:00 AM</p>
              <p style="color: #4b5563; font-size: 14px; line-height: 24px; margin: 0 0 8px;">- You will receive check-in instructions 24 hours before your arrival</p>
              <p style="color: #4b5563; font-size: 14px; line-height: 24px; margin: 0;">- Please have your booking ID ready upon arrival</p>
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
                We look forward to hosting you! If you have any questions or special requests, please reply to this email.
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

export default BookingConfirmedEmail;

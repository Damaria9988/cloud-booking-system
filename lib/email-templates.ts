// Email template utilities

interface BookingEmailData {
  userName: string
  bookingId: string
  pnr: string
  fromCity: string
  toCity: string
  travelDate: string
  departureTime: string
  arrivalTime: string
  operatorName: string
  vehicleType: string
  seats: string[]
  totalAmount: number
  qrCodeUrl?: string
}

export function generateBookingConfirmationEmail(data: BookingEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #1f2937; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      padding: 40px 20px; 
    }
    .email-wrapper { max-width: 600px; margin: 0 auto; }
    .container { 
      background: #ffffff; 
      border-radius: 16px; 
      overflow: hidden; 
      box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      padding: 50px 40px; 
      text-align: center; 
      position: relative;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6);
    }
    .header-icon { 
      width: 80px; 
      height: 80px; 
      background: rgba(255,255,255,0.2); 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      margin: 0 auto 20px; 
      font-size: 40px;
      backdrop-filter: blur(10px);
    }
    .header h1 { 
      color: white; 
      font-size: 32px; 
      font-weight: 700; 
      margin-bottom: 8px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header p { 
      color: rgba(255,255,255,0.9); 
      font-size: 16px; 
    }
    .content { padding: 40px; }
    .success-badge {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 8px 20px;
      border-radius: 50px;
      display: inline-block;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 24px;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    }
    .greeting { 
      font-size: 24px; 
      font-weight: 700; 
      color: #111827; 
      margin-bottom: 12px;
    }
    .subtitle { 
      color: #6b7280; 
      font-size: 16px; 
      margin-bottom: 32px;
    }
    .booking-card { 
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); 
      border-radius: 12px; 
      padding: 24px; 
      margin: 24px 0;
      border: 1px solid #e5e7eb;
      position: relative;
      overflow: hidden;
    }
    .booking-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
    }
    .card-header {
      font-size: 18px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 20px;
      padding-left: 12px;
    }
    .booking-detail { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      padding: 14px 12px; 
      background: white;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .booking-detail:last-child { margin-bottom: 0; }
    .label { 
      color: #6b7280; 
      font-size: 14px; 
      font-weight: 500;
    }
    .value { 
      font-weight: 700; 
      color: #111827; 
      font-size: 15px;
    }
    .value.highlight {
      color: #667eea;
      font-size: 18px;
      font-family: 'Courier New', monospace;
    }
    .value.amount {
      color: #10b981;
      font-size: 20px;
    }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white !important; 
      padding: 16px 40px; 
      text-decoration: none; 
      border-radius: 50px; 
      font-weight: 700; 
      font-size: 16px;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      text-align: center;
      display: block;
      max-width: 300px;
      margin: 30px auto;
    }
    .important-note { 
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); 
      border-radius: 12px; 
      padding: 20px; 
      margin: 24px 0;
      border-left: 4px solid #f59e0b;
    }
    .important-note strong {
      color: #92400e;
      font-size: 16px;
      display: block;
      margin-bottom: 12px;
    }
    .important-note ul {
      margin: 12px 0 0 20px;
      color: #78350f;
    }
    .important-note li {
      margin-bottom: 8px;
    }
    .footer { 
      background: #f9fafb; 
      padding: 32px 40px; 
      text-align: center; 
      border-top: 1px solid #e5e7eb;
    }
    .footer p { 
      color: #6b7280; 
      font-size: 14px; 
      margin: 8px 0;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e5e7eb;
      margin: 0 6px;
      line-height: 36px;
      text-decoration: none;
      color: #6b7280;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="header-icon">✈️</div>
        <h1>Booking Confirmed!</h1>
        <p>Your adventure begins now</p>
      </div>
      
      <div class="content">
        <div style="text-align: center;">
          <span class="success-badge">✓ CONFIRMED</span>
        </div>
        
        <h2 class="greeting">Hi ${data.userName}! 👋</h2>
        <p class="subtitle">Great news! Your booking is confirmed and ready. Get excited for your journey!</p>
        
        <div class="booking-card">
          <div class="card-header">📋 Booking Details</div>
          
          <div class="booking-detail">
            <span class="label">🎫 PNR Number</span>
            <span class="value highlight">${data.pnr}</span>
          </div>
          
          <div class="booking-detail">
            <span class="label">📝 Booking ID</span>
            <span class="value">${data.bookingId}</span>
          </div>
          
          <div class="booking-detail">
            <span class="label">📍 Route</span>
            <span class="value">${data.fromCity} → ${data.toCity}</span>
          </div>
          
          <div class="booking-detail">
            <span class="label">📅 Travel Date</span>
            <span class="value">${data.travelDate}</span>
          </div>
          
          <div class="booking-detail">
            <span class="label">🕐 Departure</span>
            <span class="value">${data.departureTime}</span>
          </div>
          
          <div class="booking-detail">
            <span class="label">🕐 Arrival</span>
            <span class="value">${data.arrivalTime}</span>
          </div>
          
          <div class="booking-detail">
            <span class="label">🚌 Operator</span>
            <span class="value">${data.operatorName}</span>
          </div>
          
          <div class="booking-detail">
            <span class="label">🚗 Vehicle Type</span>
            <span class="value">${data.vehicleType}</span>
          </div>
          
          <div class="booking-detail">
            <span class="label">💺 Seat(s)</span>
            <span class="value">${data.seats.join(", ")}</span>
          </div>
          
          <div class="booking-detail">
            <span class="label">💰 Total Amount</span>
            <span class="value amount">₹${data.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="important-note">
          <strong>✨ Before You Travel</strong>
          <ul>
            <li>Arrive 15 minutes early at the boarding point</li>
            <li>Keep a valid government ID with you</li>
            <li>Show your e-ticket QR code for verification</li>
            <li>Save this email for easy access to your ticket</li>
          </ul>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/booking/ticket?bookingId=${data.bookingId}" class="button">
          View E-Ticket →
        </a>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 15px; margin: 0;">
            Questions? We're here to help! 💬
          </p>
          <p style="color: #9ca3af; font-size: 14px; margin: 8px 0 0 0;">
            Reply to this email or visit our support center
          </p>
        </div>
      </div>
      
      <div class="footer">
        <div class="social-links">
          <a href="#">f</a>
          <a href="#">𝕏</a>
          <a href="#">in</a>
          <a href="#">📷</a>
        </div>
        <p style="font-weight: 600; color: #111827;">TravelFlow</p>
        <p>Making travel booking effortless</p>
        <p style="margin-top: 16px;">© ${new Date().getFullYear()} TravelFlow. All rights reserved.</p>
        <p style="font-size: 12px; color: #9ca3af;">You're receiving this because you booked a trip with us.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

export function generateBookingConfirmationText(data: BookingEmailData): string {
  return `
Booking Confirmed!

Hi ${data.userName},

Your booking has been confirmed. Here are your booking details:

PNR Number: ${data.pnr}
Booking ID: ${data.bookingId}
Route: ${data.fromCity} → ${data.toCity}
Travel Date: ${data.travelDate}
Departure: ${data.departureTime}
Arrival: ${data.arrivalTime}
Operator: ${data.operatorName}
Vehicle Type: ${data.vehicleType}
Seat(s): ${data.seats.join(", ")}
Total Amount: ₹${data.totalAmount.toFixed(2)}

IMPORTANT:
- Please arrive at the boarding point 15 minutes before departure
- Carry a valid ID proof for verification
- Show your e-ticket or QR code at the boarding point

View your e-ticket: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/booking/ticket?bookingId=${data.bookingId}

Need help? Reply to this email or contact our support team.

© ${new Date().getFullYear()} TravelFlow. All rights reserved.
  `.trim()
}

interface PaymentFailureEmailData {
  userName: string
  amount: number
  reason?: string
}

export function generatePaymentFailureEmail(data: PaymentFailureEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Failed</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #1f2937; 
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
      padding: 40px 20px; 
    }
    .email-wrapper { max-width: 600px; margin: 0 auto; }
    .container { 
      background: #ffffff; 
      border-radius: 16px; 
      overflow: hidden; 
      box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
    }
    .header { 
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
      padding: 50px 40px; 
      text-align: center; 
    }
    .header-icon { 
      width: 80px; 
      height: 80px; 
      background: rgba(255,255,255,0.2); 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      margin: 0 auto 20px; 
      font-size: 40px;
      backdrop-filter: blur(10px);
    }
    .header h1 { 
      color: white; 
      font-size: 28px; 
      font-weight: 700;
      text-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .content { padding: 40px; }
    .greeting { 
      font-size: 22px; 
      font-weight: 700; 
      color: #111827; 
      margin-bottom: 12px;
    }
    .subtitle { 
      color: #6b7280; 
      font-size: 16px; 
      margin-bottom: 24px;
    }
    .info-box { 
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); 
      border-radius: 12px; 
      padding: 20px; 
      margin: 24px 0;
      border-left: 4px solid #ef4444;
    }
    .info-box strong {
      color: #991b1b;
      display: block;
      margin-bottom: 8px;
    }
    .amount-box {
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .amount-box .label {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 8px;
    }
    .amount-box .amount {
      color: #111827;
      font-size: 32px;
      font-weight: 700;
    }
    .reasons {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .reasons h3 {
      color: #111827;
      font-size: 16px;
      margin-bottom: 16px;
    }
    .reasons ul {
      margin-left: 20px;
      color: #6b7280;
    }
    .reasons li {
      margin-bottom: 8px;
    }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white !important; 
      padding: 16px 40px; 
      text-decoration: none; 
      border-radius: 50px; 
      font-weight: 700; 
      font-size: 16px;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
      text-align: center;
      display: block;
      max-width: 300px;
      margin: 30px auto;
    }
    .footer { 
      background: #f9fafb; 
      padding: 32px 40px; 
      text-align: center; 
      border-top: 1px solid #e5e7eb;
    }
    .footer p { 
      color: #6b7280; 
      font-size: 14px; 
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="header-icon">⚠️</div>
        <h1>Payment Could Not Be Processed</h1>
      </div>
      
      <div class="content">
        <h2 class="greeting">Hi ${data.userName},</h2>
        <p class="subtitle">We encountered an issue while processing your payment. Don't worry, no charges were made to your account.</p>
        
        <div class="amount-box">
          <div class="label">Attempted Amount</div>
          <div class="amount">₹${data.amount.toFixed(2)}</div>
        </div>
        
        ${data.reason ? `
        <div class="info-box">
          <strong>What happened:</strong>
          ${data.reason}
        </div>
        ` : ''}
        
        <div class="reasons">
          <h3>💡 Common reasons for payment failures:</h3>
          <ul>
            <li>Insufficient balance in your account</li>
            <li>Incorrect card details or CVV</li>
            <li>Card expired or blocked by your bank</li>
            <li>Transaction timed out</li>
            <li>International transactions disabled</li>
          </ul>
        </div>
        
        <p style="text-align: center; color: #6b7280; margin: 24px 0;">
          No worries! You can try again with the same or a different payment method.
        </p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/search" class="button">
          Try Booking Again →
        </a>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 15px; margin: 0;">
            Still having issues? 🤔
          </p>
          <p style="color: #9ca3af; font-size: 14px; margin: 8px 0 0 0;">
            Contact our support team and we'll help you out!
          </p>
        </div>
      </div>
      
      <div class="footer">
        <p style="font-weight: 600; color: #111827;">TravelFlow Support</p>
        <p>We're here to help you book with confidence</p>
        <p style="margin-top: 16px;">© ${new Date().getFullYear()} TravelFlow. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

interface CancellationEmailData {
  userName: string
  bookingId: string
  pnr: string
  fromCity: string
  toCity: string
  travelDate: string
  refundAmount: number
}

export function generateCancellationEmail(data: CancellationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Cancelled</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 30px; }
    .info-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .booking-detail { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .label { color: #6b7280; font-size: 14px; }
    .value { font-weight: 600; color: #111827; }
    .footer { background-color: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Cancelled</h1>
    </div>
    
    <div class="content">
      <h2 style="text-align: center; color: #111827; margin-bottom: 10px;">Hi ${data.userName},</h2>
      <p style="text-align: center; color: #6b7280;">Your booking has been cancelled as per your request.</p>
      
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div class="booking-detail">
          <span class="label">PNR Number</span>
          <span class="value">${data.pnr}</span>
        </div>
        <div class="booking-detail">
          <span class="label">Booking ID</span>
          <span class="value">${data.bookingId}</span>
        </div>
        <div class="booking-detail">
          <span class="label">Route</span>
          <span class="value">${data.fromCity} → ${data.toCity}</span>
        </div>
        <div class="booking-detail">
          <span class="label">Travel Date</span>
          <span class="value">${data.travelDate}</span>
        </div>
        <div class="booking-detail">
          <span class="label">Refund Amount</span>
          <span class="value" style="color: #10b981; font-size: 18px;">₹${data.refundAmount.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="info-box">
        <strong>💰 Refund Information:</strong><br>
        Your refund of ₹${data.refundAmount.toFixed(2)} will be processed within 5-7 business days to your original payment method.
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        We're sorry to see you cancel. If you have any concerns or need assistance with a new booking, please don't hesitate to contact us.
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 5px 0;">© ${new Date().getFullYear()} TravelFlow. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `
}

interface OTPEmailData {
  userName: string
  otpCode: string
  expiryMinutes: number
}

export function generateOTPEmail(data: OTPEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #1f2937; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      padding: 40px 20px; 
    }
    .email-wrapper { max-width: 600px; margin: 0 auto; }
    .container { 
      background: #ffffff; 
      border-radius: 16px; 
      overflow: hidden; 
      box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      padding: 50px 40px; 
      text-align: center; 
      position: relative;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6);
    }
    .header-icon { 
      width: 80px; 
      height: 80px; 
      background: rgba(255,255,255,0.2); 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      margin: 0 auto 20px; 
      font-size: 40px;
      backdrop-filter: blur(10px);
    }
    .header h1 { 
      color: white; 
      font-size: 28px; 
      font-weight: 700;
      text-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .content { padding: 40px; }
    .greeting { 
      font-size: 22px; 
      font-weight: 700; 
      color: #111827; 
      margin-bottom: 12px;
    }
    .subtitle { 
      color: #6b7280; 
      font-size: 16px; 
      margin-bottom: 32px;
    }
    .otp-container {
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      margin: 32px 0;
      border: 2px solid #e5e7eb;
    }
    .otp-label {
      color: #6b7280;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }
    .otp-code {
      font-size: 48px;
      font-weight: 800;
      color: #667eea;
      letter-spacing: 12px;
      font-family: 'Courier New', monospace;
      background: white;
      padding: 20px 40px;
      border-radius: 12px;
      display: inline-block;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
      border: 3px dashed #667eea;
    }
    .expiry-info {
      margin-top: 20px;
      color: #f59e0b;
      font-size: 14px;
      font-weight: 600;
    }
    .warning-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-rounded: 12px;
      padding: 20px;
      margin: 24px 0;
      border-left: 4px solid #f59e0b;
    }
    .warning-box strong {
      color: #92400e;
      display: block;
      margin-bottom: 8px;
      font-size: 16px;
    }
    .warning-box p {
      color: #78350f;
      margin: 8px 0;
    }
    .security-tips {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .security-tips h3 {
      color: #111827;
      font-size: 16px;
      margin-bottom: 16px;
    }
    .security-tips ul {
      margin-left: 20px;
      color: #6b7280;
    }
    .security-tips li {
      margin-bottom: 8px;
    }
    .footer { 
      background: #f9fafb; 
      padding: 32px 40px; 
      text-align: center; 
      border-top: 1px solid #e5e7eb;
    }
    .footer p { 
      color: #6b7280; 
      font-size: 14px; 
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="header-icon">🔐</div>
        <h1>Password Reset Request</h1>
      </div>
      
      <div class="content">
        <h2 class="greeting">Hi ${data.userName},</h2>
        <p class="subtitle">We received a request to reset your password. Use the OTP code below to complete the process.</p>
        
        <div class="otp-container">
          <div class="otp-label">Your OTP Code</div>
          <div class="otp-code">${data.otpCode}</div>
          <div class="expiry-info">⏱️ Expires in ${data.expiryMinutes} minutes</div>
        </div>
        
        <div class="warning-box">
          <strong>🔒 Security Notice</strong>
          <p>If you didn't request this password reset, please ignore this email. Your account is secure.</p>
        </div>
        
        <div class="security-tips">
          <h3>🛡️ Security Tips:</h3>
          <ul>
            <li>Never share your OTP code with anyone</li>
            <li>TravelFlow staff will never ask for your OTP</li>
            <li>Use a strong, unique password for your account</li>
            <li>Enable two-factor authentication if available</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 15px; margin: 0;">
            Need help? 🤔
          </p>
          <p style="color: #9ca3af; font-size: 14px; margin: 8px 0 0 0;">
            Contact our support team if you have any concerns
          </p>
        </div>
      </div>
      
      <div class="footer">
        <p style="font-weight: 600; color: #111827;">TravelFlow Security</p>
        <p>Keeping your account safe and secure</p>
        <p style="margin-top: 16px;">© ${new Date().getFullYear()} TravelFlow. All rights reserved.</p>
        <p style="font-size: 12px; color: #9ca3af;">This is an automated security email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

interface EmailVerificationData {
  userName: string
  verificationLink: string
  expiryHours: number
}

export function generateEmailVerificationEmail(data: EmailVerificationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #1f2937; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      padding: 40px 20px; 
    }
    .email-wrapper { max-width: 600px; margin: 0 auto; }
    .container { 
      background: #ffffff; 
      border-radius: 16px; 
      overflow: hidden; 
      box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      padding: 50px 40px; 
      text-align: center; 
      position: relative;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6);
    }
    .header-icon { 
      width: 80px; 
      height: 80px; 
      background: rgba(255,255,255,0.2); 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      margin: 0 auto 20px; 
      font-size: 40px;
      backdrop-filter: blur(10px);
    }
    .header h1 { 
      color: white; 
      font-size: 28px; 
      font-weight: 700;
      text-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .content { padding: 40px; }
    .greeting { 
      font-size: 22px; 
      font-weight: 700; 
      color: #111827; 
      margin-bottom: 12px;
    }
    .subtitle { 
      color: #6b7280; 
      font-size: 16px; 
      margin-bottom: 32px;
    }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white !important; 
      padding: 16px 40px; 
      text-decoration: none; 
      border-radius: 50px; 
      font-weight: 700; 
      font-size: 16px;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
      text-align: center;
      display: block;
      max-width: 300px;
      margin: 30px auto;
    }
    .info-box {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
      border-left: 4px solid #3b82f6;
    }
    .info-box p {
      color: #1e40af;
      margin: 8px 0;
      font-size: 14px;
    }
    .warning-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
      border-left: 4px solid #f59e0b;
    }
    .warning-box strong {
      color: #92400e;
      display: block;
      margin-bottom: 8px;
      font-size: 16px;
    }
    .warning-box p {
      color: #78350f;
      margin: 8px 0;
    }
    .footer { 
      background: #f9fafb; 
      padding: 32px 40px; 
      text-align: center; 
      border-top: 1px solid #e5e7eb;
    }
    .footer p { 
      color: #6b7280; 
      font-size: 14px; 
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="header-icon">✉️</div>
        <h1>Verify Your Email Address</h1>
      </div>
      
      <div class="content">
        <h2 class="greeting">Welcome ${data.userName}! 🎉</h2>
        <p class="subtitle">Thanks for signing up with TravelFlow! We're excited to have you on board. Please verify your email address to get started.</p>
        
        <a href="${data.verificationLink}" class="button">
          Verify Email Address →
        </a>
        
        <div class="info-box">
          <p><strong>🔗 Or copy this link:</strong></p>
          <p style="word-break: break-all; font-family: monospace; font-size: 12px;">${data.verificationLink}</p>
        </div>
        
        <div class="warning-box">
          <strong>⏰ Important</strong>
          <p>This verification link will expire in ${data.expiryHours} hours.</p>
          <p>If you didn't create an account with TravelFlow, you can safely ignore this email.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 15px; margin: 0;">
            Need help? 🤔
          </p>
          <p style="color: #9ca3af; font-size: 14px; margin: 8px 0 0 0;">
            Contact our support team if you have any questions
          </p>
        </div>
      </div>
      
      <div class="footer">
        <p style="font-weight: 600; color: #111827;">TravelFlow</p>
        <p>Making travel booking effortless</p>
        <p style="margin-top: 16px;">© ${new Date().getFullYear()} TravelFlow. All rights reserved.</p>
        <p style="font-size: 12px; color: #9ca3af;">This is an automated verification email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

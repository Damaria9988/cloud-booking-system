import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/get-user"
import { query } from "@/lib/db"

// GET /api/bookings/[id] - Get booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const bookingId = parseInt(id)

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 }
      )
    }

    // Get booking with full details
    const bookings = await query(
      `SELECT b.*, r.from_city, r.to_city, r.from_state, r.to_state, r.from_country, r.to_country,
              r.departure_time, r.arrival_time, r.duration_minutes,
              o.name as operator_name, o.rating, o.total_reviews,
              s.travel_date, s.available_seats
       FROM bookings b
       JOIN routes r ON b.route_id = r.id
       JOIN operators o ON r.operator_id = o.id
       JOIN schedules s ON b.schedule_id = s.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [bookingId, user.id]
    )

    if (bookings.length === 0) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    const booking = bookings[0]

    // Get passengers
    const passengers = await query(
      `SELECT seat_number, first_name, last_name, age, gender
       FROM passengers
       WHERE booking_id = $1
       ORDER BY seat_number`,
      [bookingId]
    )

    // Format response
    const formattedBooking = {
      id: booking.id,
      bookingId: booking.booking_id,
      pnr: booking.pnr,
      status: booking.booking_status,
      paymentStatus: booking.payment_status,
      from: booking.from_city,
      fromState: booking.from_state,
      fromCountry: booking.from_country,
      to: booking.to_city,
      toState: booking.to_state,
      toCountry: booking.to_country,
      operator: booking.operator_name,
      operatorRating: booking.rating,
      date: booking.travel_date,
      departureTime: booking.departure_time,
      arrivalTime: booking.arrival_time,
      duration: `${Math.floor(booking.duration_minutes / 60)}h ${booking.duration_minutes % 60}m`,
      passengers: passengers.map((p: any) => ({
        seat: p.seat_number,
        firstName: p.first_name,
        lastName: p.last_name,
        age: p.age,
        gender: p.gender,
      })),
      totalAmount: parseFloat(booking.total_amount),
      discountAmount: parseFloat(booking.discount_amount || 0),
      taxAmount: parseFloat(booking.tax_amount),
      finalAmount: parseFloat(booking.final_amount),
      promoCode: booking.promo_code,
      paymentMethod: booking.payment_method,
      qrCodeData: booking.qr_code_data,
      contactEmail: booking.contact_email,
      contactPhone: booking.contact_phone,
      createdAt: booking.created_at,
    }

    return NextResponse.json({ booking: formattedBooking })
  } catch (error) {
    console.error("Get booking error:", error)
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    )
  }
}


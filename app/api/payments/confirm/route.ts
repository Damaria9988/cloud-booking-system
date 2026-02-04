import { NextRequest, NextResponse } from "next/server"
import { db, dbInstance } from "@/lib/db"
import { getCurrentUser } from "@/lib/get-user"
import { broadcastSeatUpdate, broadcastBookingCreated } from "@/lib/websocket-broadcast"

/**
 * Simple Mock Payment Confirmation
 * POST /api/payments/confirm
 * Simulates instant payment processing
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { scheduleId, seats, passengers, totalAmount, promoCode } = body

    // Validate input
    if (!scheduleId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return NextResponse.json(
        { error: "Invalid booking data" },
        { status: 400 }
      )
    }

    // Simulate payment processing delay (1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Generate PNR
    const timestamp = Date.now().toString().slice(-6)
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const pnr = `TF${timestamp}${randomNum}`

    // Create booking
    const bookingResult = dbInstance.prepare(`
      INSERT INTO bookings (
        user_id, schedule_id, pnr, booking_status,
        payment_status, payment_method, total_amount,
        created_at, updated_at
      ) VALUES (?, ?, ?, 'confirmed', 'completed', 'instant', ?, datetime('now'), datetime('now'))
    `).run(user.id, scheduleId, pnr, totalAmount)

    const bookingId = Number(bookingResult.lastInsertRowid)

    // Insert passengers
    for (const passenger of passengers) {
      dbInstance.prepare(`
        INSERT INTO passengers (
          booking_id, first_name, last_name, age,
          gender, created_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).run(
        bookingId,
        passenger.firstName,
        passenger.lastName,
        passenger.age,
        passenger.gender
      )
    }

    // Insert seat bookings
    for (const seat of seats) {
      dbInstance.prepare(`
        INSERT INTO seat_bookings (
          booking_id, schedule_id, seat_number,
          status, created_at
        ) VALUES (?, ?, ?, 'booked', datetime('now'))
      `).run(bookingId, scheduleId, seat)
    }

    // Broadcast real-time updates
    try {
      const updatedSeats = await db.getSeatAvailability(scheduleId)
      const updatedBookedSeats: string[] = Array.isArray(updatedSeats.bookedSeats) ? updatedSeats.bookedSeats : []
      const availableSeatsCount = typeof updatedSeats.availableSeats === 'number' ? updatedSeats.availableSeats : 0
      
      broadcastSeatUpdate(scheduleId, availableSeatsCount, updatedBookedSeats)
      
      broadcastBookingCreated(bookingId, scheduleId, {
        id: bookingId,
        pnr,
        userName: `${user.firstName || ''} ${user.lastName || ''}`,
        seats: seats.length,
        amount: totalAmount,
        createdAt: new Date().toISOString(),
      })
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError)
    }

    return NextResponse.json({
      success: true,
      message: "Payment successful! Your booking is confirmed.",
      booking: {
        id: bookingId,
        pnr,
        status: "confirmed",
        paymentStatus: "completed",
        totalAmount,
      },
    })
  } catch (error) {
    console.error("Payment confirmation error:", error)
    return NextResponse.json(
      { error: "Payment processing failed. Please try again." },
      { status: 500 }
    )
  }
}

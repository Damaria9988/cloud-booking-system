import { NextRequest, NextResponse } from "next/server"
import { db, query } from "@/lib/db"
import { execute } from "@/lib/db/connection"
import { getCurrentUser } from "@/lib/get-user"
import { broadcastSeatUpdate, broadcastBookingCancelled } from "@/lib/websocket-broadcast"

// PATCH /api/bookings/[id]/cancel - Cancel booking
export async function PATCH(
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

    // Check if booking exists and belongs to user
    let bookings
    try {
      bookings = await query(
        `SELECT b.*, s.id as schedule_id, s.travel_date, 
                r.from_city, r.to_city, u.first_name, u.last_name, u.email
         FROM bookings b
         JOIN schedules s ON b.schedule_id = s.id
         JOIN routes r ON b.route_id = r.id
         JOIN users u ON b.user_id = u.id
         WHERE b.id = ? AND b.user_id = ?`,
        [bookingId, user.id]
      )
    } catch (dbError) {
      console.error("Database query error:", dbError)
      return NextResponse.json(
        { error: "Failed to retrieve booking information" },
        { status: 500 }
      )
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json(
        { error: "Booking not found or you don't have permission to cancel it" },
        { status: 404 }
      )
    }

    const booking = bookings[0]

    // Check if booking can be cancelled
    if (booking.booking_status === "cancelled") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      )
    }

    if (booking.booking_status === "completed") {
      return NextResponse.json(
        { error: "Completed bookings cannot be cancelled" },
        { status: 400 }
      )
    }

    // Process cancellation
    try {
      // Update booking status first
      await execute(
        `UPDATE bookings 
         SET booking_status = 'cancelled',
             payment_status = 'refunded',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [bookingId]
      )

      // Use atomic seat release to prevent race conditions
      // Note: atomicSeatRelease already uses withTransaction internally
      const { atomicSeatRelease } = await import("@/lib/transaction")
      const releaseResult = await atomicSeatRelease(bookingId, booking.schedule_id)
      if (!releaseResult.success) {
        // Rollback: restore booking status if seat release fails
        await execute(
          `UPDATE bookings 
           SET booking_status = 'confirmed',
               payment_status = 'completed',
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [bookingId]
        )
        throw new Error("Failed to release seats during cancellation")
      }
    } catch (updateError) {
      console.error("Database update error:", updateError)
      return NextResponse.json(
        { error: "Failed to process cancellation. Please try again or contact support." },
        { status: 500 }
      )
    }

    // Email sending removed - keeping it simple

    // Broadcast real-time updates
    try {
      // Get updated seat availability
      const updatedSeats = await db.getSeatAvailability(booking.schedule_id)
      const updatedBookedSeats: string[] = Array.isArray(updatedSeats.bookedSeats) ? updatedSeats.bookedSeats : []
      const availableSeatsCount = typeof updatedSeats.availableSeats === 'number' ? updatedSeats.availableSeats : 0
      broadcastSeatUpdate(booking.schedule_id, availableSeatsCount, updatedBookedSeats)
      
      // Broadcast cancellation
      broadcastBookingCancelled(bookingId, booking.schedule_id)
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError)
      // Don't fail the cancellation if WebSocket fails
    }

    return NextResponse.json({
      message: "Booking cancelled successfully. A confirmation email has been sent.",
      booking: {
        id: booking.id,
        status: "cancelled",
      },
    })
  } catch (error) {
    console.error("Cancel booking error:", error)
    
    // Handle specific error types
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || "Failed to cancel booking" },
        { status: 500 }
      )
    }
    
    // Handle unknown error types
    return NextResponse.json(
      { error: "An unexpected error occurred while cancelling the booking" },
      { status: 500 }
    )
  }
}


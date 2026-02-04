import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"

// PATCH /api/admin/bookings/[id]/cancel - Force cancel booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await requireAdmin()

    // Handle both sync and async params (Next.js 13+ vs 15+)
    const resolvedParams = params instanceof Promise ? await params : params
    const idParam = resolvedParams.id
    
    if (!idParam) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }
    
    const bookingId = parseInt(idParam)
    if (isNaN(bookingId) || bookingId <= 0) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 })
    }

    // Get booking details
    const booking = await db.getBookingById(bookingId)
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Update booking status
    await db.updateBookingStatus(bookingId, "cancelled")

    // Free up seats
    await db.execute(
      `UPDATE seat_bookings SET status = 'cancelled' WHERE booking_id = ?`,
      [bookingId]
    )

    // Update available seats count
    const scheduleId = booking.schedule_id
    if (scheduleId) {
      const passengers = await db.query<{ count: number }>(
        `SELECT COUNT(*) as count FROM passengers WHERE booking_id = ?`,
        [bookingId]
      )
      const passengerCount = passengers[0]?.count || 0

      if (passengerCount > 0) {
        await db.execute(
          `UPDATE schedules SET available_seats = available_seats + ? WHERE id = ?`,
          [passengerCount, scheduleId]
        )
      }
    }

    // Update payment status to refunded
    await db.execute(
      `UPDATE bookings SET payment_status = 'refunded' WHERE id = ?`,
      [bookingId]
    )

    const updatedBooking = await db.getBookingById(bookingId)

    return NextResponse.json({
      message: "Booking cancelled successfully. Seats have been freed.",
      booking: updatedBooking,
    })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Cancel booking error:", error)
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 })
  }
}


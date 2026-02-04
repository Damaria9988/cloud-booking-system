import { NextRequest, NextResponse } from "next/server"
import { db, query, dbInstance } from "@/lib/db"
import { getCurrentUser } from "@/lib/get-user"
import { broadcastSeatUpdate } from "@/lib/websocket-broadcast"

// PATCH /api/bookings/[id]/modify - Modify booking (change seats or date)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please login to modify bookings." },
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

    const body = await request.json()
    const { newSeats, newTravelDate } = body

    if (!newSeats && !newTravelDate) {
      return NextResponse.json(
        { error: "Either newSeats or newTravelDate must be provided" },
        { status: 400 }
      )
    }

    // Get booking details
    const bookings = await query(
      `SELECT 
        b.id,
        b.user_id,
        b.schedule_id,
        b.route_id,
        b.travel_date,
        b.booking_status,
        b.pnr,
        u.email,
        u.first_name,
        u.last_name,
        r.from_city,
        r.to_city
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN routes r ON b.route_id = r.id
       WHERE b.id = ?`,
      [bookingId]
    )

    if (bookings.length === 0) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    const booking = bookings[0]

    // Check if booking belongs to the user
    if (booking.user_id !== user.id) {
      return NextResponse.json(
        { error: "You can only modify your own bookings" },
        { status: 403 }
      )
    }

    // Check if booking can be modified
    if (booking.booking_status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot modify a cancelled booking" },
        { status: 400 }
      )
    }

    if (booking.booking_status === "completed") {
      return NextResponse.json(
        { error: "Cannot modify a completed booking" },
        { status: 400 }
      )
    }

    // Check if modification is within allowed time (e.g., 24 hours before travel)
    const travelDate = new Date(booking.travel_date)
    const now = new Date()
    const hoursDiff = (travelDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursDiff < 24) {
      return NextResponse.json(
        { error: "Modifications are not allowed within 24 hours of travel" },
        { status: 400 }
      )
    }

    // Handle seat modification
    if (newSeats && Array.isArray(newSeats)) {
      // Get current seats
      const currentSeats = await query(
        `SELECT seat_number FROM seat_bookings WHERE booking_id = ? AND status = 'booked'`,
        [bookingId]
      )

      const currentSeatNumbers = currentSeats.map((s: any) => s.seat_number)

      // Check if new seats are different
      if (JSON.stringify(currentSeatNumbers.sort()) === JSON.stringify(newSeats.sort())) {
        return NextResponse.json(
          { error: "New seats are the same as current seats" },
          { status: 400 }
        )
      }

      // Check if new seats are available
      const seatAvailability = await db.getSeatAvailability(booking.schedule_id)
      const bookedSeatsArray = Array.isArray(seatAvailability.bookedSeats) ? seatAvailability.bookedSeats : []
      const unavailableSeats = newSeats.filter(
        (seat: string) => bookedSeatsArray.includes(seat) && !currentSeatNumbers.includes(seat)
      )

      if (unavailableSeats.length > 0) {
        return NextResponse.json(
          { error: `Seats ${unavailableSeats.join(", ")} are no longer available` },
          { status: 409 }
        )
      }

      // Update seat bookings using transaction for atomicity
      const { withTransaction } = await import("@/lib/transaction")
      
      await withTransaction(async () => {
        // First, mark old seats as cancelled
        await db.execute(
          `UPDATE seat_bookings
           SET status = 'cancelled',
               updated_at = datetime('now')
           WHERE booking_id = ?`,
          [bookingId]
        )

        // Then, create new seat bookings
        for (const seat of newSeats) {
          await db.execute(
            `INSERT INTO seat_bookings (booking_id, schedule_id, seat_number, status)
             VALUES (?, ?, ?, 'booked')`,
            [bookingId, booking.schedule_id, seat]
          )
        }

        // Update booking updated_at timestamp
        await db.execute(
          `UPDATE bookings SET updated_at = datetime('now') WHERE id = ?`,
          [bookingId]
        )
      })

      // Broadcast real-time updates
      try {
        const updatedSeats = await db.getSeatAvailability(booking.schedule_id)
        const updatedBookedSeats: string[] = Array.isArray(updatedSeats.bookedSeats) ? updatedSeats.bookedSeats : []
        const availableSeatsCount = typeof updatedSeats.availableSeats === 'number' ? updatedSeats.availableSeats : 0
        broadcastSeatUpdate(booking.schedule_id, availableSeatsCount, updatedBookedSeats)
      } catch (wsError) {
        console.error('WebSocket broadcast error:', wsError)
      }

      // Email sending removed - keeping it simple

      return NextResponse.json({
        message: "Booking seats modified successfully",
        booking: {
          id: booking.id,
          pnr: booking.pnr,
          oldSeats: currentSeatNumbers,
          newSeats,
        },
      })
    }

    // Handle date modification
    if (newTravelDate) {
      // Find a schedule for the new date
      const newSchedules = await query(
        `SELECT id, available_seats
         FROM schedules
         WHERE route_id = ?
         AND travel_date = date(?)
         AND is_cancelled = 0
         AND available_seats >= (
           SELECT COUNT(*) FROM seat_bookings WHERE booking_id = ? AND status = 'booked'
         )`,
        [booking.route_id, newTravelDate, bookingId]
      )

      if (newSchedules.length === 0) {
        return NextResponse.json(
          { error: "No available schedules found for the selected date" },
          { status: 404 }
        )
      }

      const newSchedule = newSchedules[0]

      // Get current seats
      const currentSeats = await query(
        `SELECT seat_number FROM seat_bookings WHERE booking_id = ? AND status = 'booked'`,
        [bookingId]
      )

      const currentSeatNumbers = currentSeats.map((s: any) => s.seat_number)

      // Check if seats are available in new schedule
      const seatAvailability = await db.getSeatAvailability(newSchedule.id)
      const bookedSeatsArray = Array.isArray(seatAvailability.bookedSeats) ? seatAvailability.bookedSeats : []
      const unavailableSeats = currentSeatNumbers.filter((seat: string) => bookedSeatsArray.includes(seat))

      if (unavailableSeats.length > 0) {
        return NextResponse.json(
          { error: `Seats ${unavailableSeats.join(", ")} are not available in the new schedule. Please choose different seats.` },
          { status: 409 }
        )
      }

      // Update booking and seat bookings using transaction for atomicity
      const { withTransaction } = await import("@/lib/transaction")
      
      await withTransaction(async () => {
        // Update booking
        await db.execute(
          `UPDATE bookings
           SET schedule_id = ?,
               travel_date = date(?),
               updated_at = datetime('now')
           WHERE id = ?`,
          [newSchedule.id, newTravelDate, bookingId]
        )

        // Update seat bookings
        await db.execute(
          `UPDATE seat_bookings
           SET schedule_id = ?,
               updated_at = datetime('now')
           WHERE booking_id = ?`,
          [newSchedule.id, bookingId]
        )
      })

      // Broadcast real-time updates for both schedules
      try {
        const oldScheduleSeats = await db.getSeatAvailability(booking.schedule_id)
        const oldBookedSeats: string[] = Array.isArray(oldScheduleSeats.bookedSeats) ? oldScheduleSeats.bookedSeats : []
        const oldAvailableCount = typeof oldScheduleSeats.availableSeats === 'number' ? oldScheduleSeats.availableSeats : 0
        broadcastSeatUpdate(booking.schedule_id, oldAvailableCount, oldBookedSeats)

        const newScheduleSeats = await db.getSeatAvailability(newSchedule.id)
        const newBookedSeats: string[] = Array.isArray(newScheduleSeats.bookedSeats) ? newScheduleSeats.bookedSeats : []
        const newAvailableCount = typeof newScheduleSeats.availableSeats === 'number' ? newScheduleSeats.availableSeats : 0
        broadcastSeatUpdate(newSchedule.id, newAvailableCount, newBookedSeats)
      } catch (wsError) {
        console.error('WebSocket broadcast error:', wsError)
      }

      // Email sending removed - keeping it simple

      return NextResponse.json({
        message: "Booking date modified successfully",
        booking: {
          id: booking.id,
          pnr: booking.pnr,
          oldDate: booking.travel_date,
          newDate: newTravelDate,
        },
      })
    }

    return NextResponse.json(
      { error: "No modifications were made" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Modify booking error:", error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || "Failed to modify booking" },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred while modifying the booking" },
      { status: 500 }
    )
  }
}

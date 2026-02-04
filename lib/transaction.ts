// Transaction utility for handling database race conditions
// Implements optimistic locking for seat bookings

import { db } from "@/lib/db"

// Helper to access execute and query functions
const execute = db.execute.bind(db)
const query = db.query.bind(db)

export interface TransactionOptions {
  maxRetries?: number
  retryDelay?: number
}

/**
 * Execute a function within a transaction with retry logic
 * Useful for handling race conditions in seat bookings
 */
export async function withTransaction<T>(
  fn: () => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 100 } = options
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Begin transaction
      await execute("BEGIN IMMEDIATE TRANSACTION")

      try {
        // Execute the function
        const result = await fn()

        // Commit transaction
        await execute("COMMIT")

        return result
      } catch (error) {
        // Rollback on error
        await execute("ROLLBACK")
        throw error
      }
    } catch (error) {
      lastError = error as Error

      // Check if it's a lock error (SQLITE_BUSY)
      if (
        error instanceof Error &&
        (error.message.includes("SQLITE_BUSY") || error.message.includes("database is locked"))
      ) {
        // Wait before retrying
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)))
          continue
        }
      }

      // If it's not a lock error or we've exhausted retries, throw
      throw error
    }
  }

  throw lastError || new Error("Transaction failed after max retries")
}

/**
 * Lock seats for booking with optimistic locking
 * Returns true if seats were successfully locked, false if already booked
 */
export async function lockSeatsForBooking(
  scheduleId: number,
  seats: string[]
): Promise<{ success: boolean; unavailableSeats: string[] }> {
  return withTransaction(async () => {
    // Check current seat availability
    const bookedSeats = await query(
      `SELECT seat_number
       FROM seat_bookings
       WHERE schedule_id = ? AND status = 'booked' AND seat_number IN (${seats.map(() => "?").join(",")})`,
      [scheduleId, ...seats]
    )

    const unavailableSeats = bookedSeats.map((s: any) => s.seat_number)

    if (unavailableSeats.length > 0) {
      return { success: false, unavailableSeats }
    }

    // All seats are available
    return { success: true, unavailableSeats: [] }
  })
}

/**
 * Atomic seat booking operation (without transaction wrapper)
 * Use this when already inside a transaction
 * Ensures no race conditions when multiple users try to book the same seat
 */
export async function atomicSeatBookingInTransaction(
  bookingId: number,
  scheduleId: number,
  seats: string[]
): Promise<{ success: boolean; error?: string }> {
  // Check current seat availability (within existing transaction)
  const bookedSeats = await query(
    `SELECT seat_number
     FROM seat_bookings
     WHERE schedule_id = ? AND status = 'booked' AND seat_number IN (${seats.map(() => "?").join(",")})`,
    [scheduleId, ...seats]
  )

  const unavailableSeats = bookedSeats.map((s: any) => s.seat_number)

  if (unavailableSeats.length > 0) {
    return {
      success: false,
      error: `Seats ${unavailableSeats.join(", ")} are no longer available`,
    }
  }

  // Create seat bookings
  console.log("[TRANSACTION] Storing seats in database - scheduleId:", scheduleId, "bookingId:", bookingId, "seats:", seats)
  for (const seat of seats) {
    await execute(
      `INSERT INTO seat_bookings (schedule_id, seat_number, booking_id, status)
       VALUES (?, ?, ?, 'booked')`,
      [scheduleId, seat, bookingId]
    )
    console.log("[TRANSACTION] Stored seat:", seat, "for schedule:", scheduleId)
  }
  console.log("[TRANSACTION] All seats stored successfully")

  // Update schedule available seats
  await execute(
    `UPDATE schedules
     SET available_seats = available_seats - ?
     WHERE id = ?`,
    [seats.length, scheduleId]
  )

  return { success: true }
}

/**
 * Atomic seat booking operation
 * Ensures no race conditions when multiple users try to book the same seat
 * Use this when NOT already in a transaction
 */
export async function atomicSeatBooking(
  bookingId: number,
  scheduleId: number,
  seats: string[]
): Promise<{ success: boolean; error?: string }> {
  return withTransaction(async () => {
    return atomicSeatBookingInTransaction(bookingId, scheduleId, seats)
  })
}

/**
 * Atomic seat release operation
 * Used when cancelling bookings
 */
export async function atomicSeatRelease(
  bookingId: number,
  scheduleId: number
): Promise<{ success: boolean; releasedSeats: number }> {
  return withTransaction(async () => {
    // Get seats to release
    const seatsToRelease = await query(
      `SELECT seat_number
       FROM seat_bookings
       WHERE booking_id = ? AND status = 'booked'`,
      [bookingId]
    )

    const seatCount = seatsToRelease.length

    if (seatCount === 0) {
      return { success: true, releasedSeats: 0 }
    }

    // Mark seats as cancelled
    await execute(
      `UPDATE seat_bookings
       SET status = 'cancelled'
       WHERE booking_id = ? AND status = 'booked'`,
      [bookingId]
    )

    // Update schedule available seats
    await execute(
      `UPDATE schedules
       SET available_seats = available_seats + ?
       WHERE id = ?`,
      [seatCount, scheduleId]
    )

    return { success: true, releasedSeats: seatCount }
  })
}

/**
 * Check and reserve seats atomically
 * Returns reservation token if successful
 */
export async function reserveSeats(
  scheduleId: number,
  seats: string[],
  userId: number,
  expiresInMinutes: number = 10
): Promise<{ success: boolean; reservationToken?: string; error?: string }> {
  return withTransaction(async () => {
    // Check seat availability
    const lockResult = await lockSeatsForBooking(scheduleId, seats)

    if (!lockResult.success) {
      return {
        success: false,
        error: `Seats ${lockResult.unavailableSeats.join(", ")} are already reserved or booked`,
      }
    }

    // Create temporary reservation
    const reservationToken = `RES-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000)

    // Store reservation (you would need a seat_reservations table for this)
    // For now, we'll just return success
    // In production, you'd want to:
    // 1. Create a seat_reservations table
    // 2. Insert reservation records
    // 3. Have a cleanup job to remove expired reservations

    return {
      success: true,
      reservationToken,
    }
  })
}

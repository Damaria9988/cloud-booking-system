/**
 * Booking database operations
 * Handles all booking-related CRUD operations, status management, and queries
 */

import { query, execute } from './connection'
import { getRouteById } from './routes'

/**
 * Create a new booking with passengers and seat bookings
 */
export async function createBooking(data: {
  userId: number
  routeId: number
  scheduleId: number
  travelDate: string
  totalAmount: number
  discountAmount: number
  taxAmount: number
  finalAmount: number
  paymentMethod?: string
  contactEmail: string
  contactPhone: string
  passengers: Array<{
    seatNumber: string
    firstName: string
    lastName: string
    age: number
    gender: string
    passengerType?: string
  }>
  tripType?: 'one-way' | 'round-trip'
  roundTripId?: string
  isReturn?: boolean
}) {
  // Import transaction utilities dynamically to avoid circular dependency
  const transactionModule = await import("@/lib/transaction")
  const { withTransaction, atomicSeatBookingInTransaction } = transactionModule
  
  // Generate booking ID and PNR
  const bookingId = "BK" + Date.now().toString().slice(-8)
  const pnr = "TF" + Math.random().toString(36).slice(2, 11).toUpperCase()
  const qrCodeData = "QR_" + Math.random().toString(36).slice(2, 18).toUpperCase()

  // Use transaction to ensure atomicity
  return withTransaction(async () => {
    // Insert booking
    const bookingResult = await execute(
      `INSERT INTO bookings 
       (booking_id, pnr, user_id, route_id, schedule_id, travel_date, 
        total_amount, discount_amount, tax_amount, final_amount, promo_code,
        payment_status, payment_method, booking_status, contact_email, contact_phone, qr_code_data,
        trip_type, round_trip_id, is_return)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingId,
        pnr,
        data.userId,
        data.routeId,
        data.scheduleId,
        data.travelDate,
        data.totalAmount,
        data.discountAmount,
        data.taxAmount,
        data.finalAmount,
        null, // promoCode commented out
        "completed", // Payment completed
        data.paymentMethod || null,
        "confirmed",
        data.contactEmail,
        data.contactPhone,
        qrCodeData,
        data.tripType || 'one-way',
        data.roundTripId || null,
        data.isReturn ? 1 : 0,
      ],
    )

    const booking = await query("SELECT * FROM bookings WHERE id = ?", [bookingResult.lastInsertRowid])
    if (booking.length === 0) {
      throw new Error("Failed to create booking")
    }

    // Insert passengers
    for (const passenger of data.passengers) {
      await execute(
        `INSERT INTO passengers (booking_id, seat_number, first_name, last_name, age, gender, passenger_type)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [booking[0].id, passenger.seatNumber, passenger.firstName, passenger.lastName, passenger.age, passenger.gender, passenger.passengerType || 'adult'],
      )
    }

    // Use atomic seat booking to prevent race conditions and update available_seats
    const seatNumbers = data.passengers.map(p => p.seatNumber)
    const seatBookingResult = await atomicSeatBookingInTransaction(booking[0].id, data.scheduleId, seatNumbers)
    
    if (!seatBookingResult.success) {
      throw new Error(seatBookingResult.error || "Failed to book seats")
    }

    return booking[0]
  })
}

/**
 * Get bookings by user ID
 */
export async function getBookingsByUser(userId: number) {
  // Auto-complete runs on a schedule now, not on every query
  // Call autoCompletePastBookingsIfNeeded() if you need to ensure it runs
  
  const results = await query(
    `SELECT b.*, r.from_city, r.to_city, r.departure_time, r.arrival_time,
            o.name as operator_name,
            GROUP_CONCAT(p.seat_number) as seats
     FROM bookings b
     JOIN routes r ON b.route_id = r.id
     JOIN operators o ON r.operator_id = o.id
     LEFT JOIN passengers p ON b.id = p.booking_id
     WHERE b.user_id = ?
     GROUP BY b.id, r.id, o.name
     ORDER BY b.travel_date DESC`,
    [userId],
  )
  // Convert GROUP_CONCAT string back to array
  return results.map((row: any) => ({
    ...row,
    seats: row.seats ? row.seats.split(',') : []
  }))
}

/**
 * Get all bookings with optional filters (admin)
 */
export async function getAllBookings(filters?: {
  routeId?: number
  dateFrom?: string
  dateTo?: string
  status?: string
  paymentStatus?: string
  vehicleType?: string
}) {
  // Auto-complete runs on a schedule now, not on every query
  // This improves performance by avoiding UPDATE on every GET
  let sql = `
    SELECT b.*, r.from_city, r.from_state, r.from_country, r.to_city, r.to_state, r.to_country,
           r.departure_time, r.arrival_time, r.vehicle_type, r.transport_type,
           o.name as operator_name,
           u.first_name || ' ' || u.last_name as user_name,
           u.email as user_email,
           GROUP_CONCAT(p.seat_number) as seats,
           GROUP_CONCAT(p.first_name || ' ' || p.last_name) as passenger_names
    FROM bookings b
    JOIN routes r ON b.route_id = r.id
    JOIN operators o ON r.operator_id = o.id
    LEFT JOIN users u ON b.user_id = u.id
    LEFT JOIN passengers p ON b.id = p.booking_id
    WHERE 1=1
  `
  const params: any[] = []

  if (filters?.routeId) {
    params.push(filters.routeId)
    sql += ` AND b.route_id = ?`
  }
  if (filters?.dateFrom) {
    params.push(filters.dateFrom)
    sql += ` AND b.travel_date >= date(?)`
  }
  if (filters?.dateTo) {
    params.push(filters.dateTo)
    sql += ` AND b.travel_date <= date(?)`
  }
  if (filters?.status) {
    params.push(filters.status)
    sql += ` AND b.booking_status = ?`
  }
  if (filters?.paymentStatus) {
    params.push(filters.paymentStatus)
    sql += ` AND b.payment_status = ?`
  }
  if (filters?.vehicleType) {
    params.push(filters.vehicleType)
    sql += ` AND r.vehicle_type = ?`
  }

  sql += ` GROUP BY b.id, r.id, o.id, u.id ORDER BY b.created_at DESC`

  const results = await query(sql, params)
  // Convert GROUP_CONCAT strings back to arrays
  return results.map((row: any) => ({
    ...row,
    seats: row.seats ? row.seats.split(',') : [],
    passenger_names: row.passenger_names ? row.passenger_names.split(',') : []
  }))
}

/**
 * Get booking by ID with full details
 */
export async function getBookingById(bookingId: number) {
  const result = await query(
    `SELECT b.*, r.from_city, r.from_state, r.to_city, r.to_state,
            r.departure_time, r.arrival_time, r.vehicle_type, r.duration_minutes,
            o.name as operator_name,
            u.first_name || ' ' || u.last_name as user_name,
            u.email as user_email
     FROM bookings b
     JOIN routes r ON b.route_id = r.id
     JOIN operators o ON r.operator_id = o.id
     LEFT JOIN users u ON b.user_id = u.id
     WHERE b.id = ?`,
    [bookingId]
  )
  
  if (result.length === 0) {
    return null
  }

  // Get passengers separately
  const passengers = await query(
    `SELECT seat_number, first_name, last_name, age, gender
     FROM passengers
     WHERE booking_id = ?`,
    [bookingId]
  )

  return {
    ...result[0],
    passengers: passengers.map((p: any) => ({
      seatNumber: p.seat_number,
      firstName: p.first_name,
      lastName: p.last_name,
      age: p.age,
      gender: p.gender
    }))
  }
}

/**
 * Get booking by PNR
 */
export async function getBookingByPNR(pnr: string) {
  const result = await query(
    `SELECT b.*, r.from_city, r.from_state, r.from_country, r.to_city, r.to_state, r.to_country,
            r.departure_time, r.arrival_time, r.duration_minutes,
            o.name as operator_name, o.rating, o.total_reviews,
            s.travel_date, s.available_seats
     FROM bookings b
     JOIN routes r ON b.route_id = r.id
     JOIN operators o ON r.operator_id = o.id
     JOIN schedules s ON b.schedule_id = s.id
     WHERE b.pnr = ?`,
    [pnr]
  )
  
  if (result.length === 0) {
    return null
  }

  const booking = result[0]

  // Get passengers
  const passengers = await query(
    `SELECT seat_number, first_name, last_name, age, gender, passenger_type
     FROM passengers
     WHERE booking_id = ?`,
    [booking.id]
  )

  return {
    ...booking,
    passengers: passengers.map((p: any) => ({
      seatNumber: p.seat_number,
      name: `${p.first_name} ${p.last_name}`,
      age: p.age,
      gender: p.gender,
      passengerType: p.passenger_type
    }))
  }
}

/**
 * Update booking status
 */
export async function updateBookingStatus(bookingId: number, status: string) {
  await execute(
    `UPDATE bookings 
     SET booking_status = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [status, bookingId]
  )
  return getBookingById(bookingId)
}

// Track when autoCompletePastBookings was last run (in-memory, per process)
let lastAutoCompleteRun: number = 0
const AUTO_COMPLETE_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Auto-complete bookings with past travel dates
 * This updates confirmed bookings to completed if travel date has passed
 * AND releases the seats so they don't show as "booked" to other users
 */
export async function autoCompletePastBookings() {
  const today = new Date().toISOString().split('T')[0]
  
  // First, get bookings that will be auto-completed (for logging/broadcasting)
  const bookingsToComplete = await query(
    `SELECT b.id, b.schedule_id 
     FROM bookings b
     WHERE b.booking_status = 'confirmed'
     AND b.travel_date < date(?)
     AND b.travel_date IS NOT NULL`,
    [today]
  )
  
  if (bookingsToComplete.length === 0) {
    lastAutoCompleteRun = Date.now()
    return 0
  }
  
  const bookingIds = bookingsToComplete.map((b: any) => b.id)
  
  // Update booking status to 'completed'
  const result = await execute(
    `UPDATE bookings 
     SET booking_status = 'completed'
     WHERE booking_status = 'confirmed'
     AND travel_date < date(?)
     AND travel_date IS NOT NULL`,
    [today]
  )
  
  // Release seats for completed bookings (change status from 'booked' to 'completed')
  // This ensures seats don't show as "booked" for future schedules on the same route
  if (bookingIds.length > 0) {
    await execute(
      `UPDATE seat_bookings 
       SET status = 'completed'
       WHERE booking_id IN (${bookingIds.map(() => '?').join(',')})
       AND status = 'booked'`,
      bookingIds
    )
    console.log(`[AUTO-COMPLETE] Released seats for ${bookingIds.length} completed bookings`)
  }
  
  lastAutoCompleteRun = Date.now()
  return result.changes
}

/**
 * Run autoCompletePastBookings only if it hasn't run recently (within 1 hour)
 * Use this for session-based execution without hammering the database
 */
export async function autoCompletePastBookingsIfNeeded(): Promise<{ ran: boolean; changes?: number }> {
  const now = Date.now()
  if (now - lastAutoCompleteRun < AUTO_COMPLETE_INTERVAL_MS) {
    return { ran: false }
  }
  const changes = await autoCompletePastBookings()
  return { ran: true, changes }
}

/**
 * Get booking statistics
 */
export async function getBookingStats() {
  return query(`
    SELECT 
      COUNT(*) as total_bookings,
      SUM(CASE WHEN booking_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
      SUM(CASE WHEN booking_status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
      SUM(CASE WHEN booking_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
      SUM(final_amount) as total_revenue
    FROM bookings
    WHERE booking_status != 'cancelled'
  `)
}

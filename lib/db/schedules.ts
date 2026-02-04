/**
 * Schedule database operations
 * Handles schedule CRUD, availability, and cancellation
 */

import { query, execute } from './connection'
import { getRouteById } from './routes'

/**
 * Get all schedules with optional filters
 */
export async function getAllSchedules(filters?: {
  routeId?: number
  dateFrom?: string
  dateTo?: string
  isCancelled?: boolean
}) {
  try {
    let sql = `
      SELECT s.id, s.route_id, s.travel_date, s.available_seats, s.is_cancelled, s.created_at,
             COALESCE(r.from_city, '') as from_city, 
             COALESCE(r.from_state, '') as from_state, 
             COALESCE(r.to_city, '') as to_city, 
             COALESCE(r.to_state, '') as to_state, 
             COALESCE(r.departure_time, '') as route_departure_time, 
             COALESCE(r.arrival_time, '') as route_arrival_time,
             COALESCE(r.vehicle_type, '') as vehicle_type, 
             COALESCE(r.base_price, 0) as base_price,
             COALESCE(dpo.price_override, r.base_price) as final_price,
             COALESCE(o.name, 'Unknown') as operator_name
      FROM schedules s
      LEFT JOIN routes r ON s.route_id = r.id
      LEFT JOIN operators o ON r.operator_id = o.id
      LEFT JOIN date_price_overrides dpo ON s.route_id = dpo.route_id AND s.travel_date = dpo.travel_date
      WHERE 1=1
    `
    const params: any[] = []

    if (filters?.routeId) {
      params.push(filters.routeId)
      sql += ` AND s.route_id = ?`
    }
    if (filters?.dateFrom) {
      params.push(filters.dateFrom)
      sql += ` AND s.travel_date >= date(?)`
    }
    if (filters?.dateTo) {
      params.push(filters.dateTo)
      sql += ` AND s.travel_date <= date(?)`
    }
    if (filters?.isCancelled !== undefined) {
      params.push(filters.isCancelled ? 1 : 0)
      sql += ` AND s.is_cancelled = ?`
    }

    sql += ` ORDER BY s.travel_date ASC, s.created_at DESC`

    const results = await query(sql, params)
    
    // Add booked_seats count
    for (const schedule of results) {
      try {
        const bookedSeatsResult = await query<{ count: number }>(
          `SELECT COUNT(*) as count FROM seat_bookings WHERE schedule_id = ? AND status = 'booked'`,
          [schedule.id]
        )
        schedule.booked_seats = bookedSeatsResult[0]?.count || 0
        
        // If final_price is not set (no override), use base_price
        if (!schedule.final_price || schedule.final_price === schedule.base_price) {
          schedule.final_price = schedule.base_price || 0
        }
      } catch (error) {
        console.error(`Error getting booked seats for schedule ${schedule.id}:`, error)
        schedule.booked_seats = 0
        schedule.final_price = schedule.base_price || 0
      }
    }
    
    return results
  } catch (error) {
    console.error('Error in getAllSchedules:', error)
    throw error
  }
}

/**
 * Get schedule by ID (admin)
 */
export async function getScheduleByIdAdmin(scheduleId: number) {
  const result = await query(
    `SELECT s.*, r.from_city, r.from_state, r.to_city, r.to_state,
            r.departure_time, r.arrival_time, r.vehicle_type, r.base_price,
            o.name as operator_name
     FROM schedules s
     JOIN routes r ON s.route_id = r.id
     JOIN operators o ON r.operator_id = o.id
     WHERE s.id = ?`,
    [scheduleId]
  )
  return result[0] || null
}

/**
 * Check if schedule with same route_id and travel_date exists
 */
export async function checkScheduleExists(routeId: number, travelDate: string, excludeId?: number): Promise<boolean> {
  let sql = `SELECT id FROM schedules WHERE route_id = ? AND travel_date = date(?)`
  const params: any[] = [routeId, travelDate]
  
  if (excludeId) {
    sql += ` AND id != ?`
    params.push(excludeId)
  }
  
  const result = await query(sql, params)
  return result.length > 0
}

/**
 * Create a new schedule
 */
export async function createSchedule(data: {
  routeId: number
  travelDate: string
  availableSeats?: number
  isCancelled?: boolean
}) {
  // Check if schedule already exists
  const exists = await checkScheduleExists(data.routeId, data.travelDate)
  if (exists) {
    throw new Error("Schedule already exists for this route and date")
  }

  // Get route to get default seat count
  const route = await getRouteById(data.routeId)
  if (!route) {
    throw new Error("Route not found")
  }

  const seatCount = data.availableSeats || route.total_seats

  const result = await execute(
    `INSERT INTO schedules (route_id, travel_date, available_seats, is_cancelled)
     VALUES (?, date(?), ?, ?)`,
    [data.routeId, data.travelDate, seatCount, data.isCancelled ? 1 : 0]
  )
  const schedules = await query("SELECT * FROM schedules WHERE id = ?", [result.lastInsertRowid])
  return schedules
}

/**
 * Cancel a schedule and all associated bookings
 */
export async function cancelSchedule(scheduleId: number) {
  // Update schedule
  await execute(
    `UPDATE schedules SET is_cancelled = 1 WHERE id = ?`,
    [scheduleId]
  )

  // Get all bookings for this schedule with user and route details
  const bookings = await query(
    `SELECT b.id, b.booking_status, b.pnr, b.total_amount,
            u.email, u.first_name, u.last_name,
            r.from_city, r.to_city, s.travel_date
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     JOIN routes r ON b.route_id = r.id
     JOIN schedules s ON b.schedule_id = s.id
     WHERE b.schedule_id = ? AND b.booking_status != 'cancelled'`,
    [scheduleId]
  )

  // Cancel all bookings
  for (const booking of bookings) {
    await execute(
      `UPDATE bookings SET booking_status = 'cancelled', payment_status = 'refunded' WHERE id = ?`,
      [booking.id]
    )

    // Free up seats
    await execute(
      `UPDATE seat_bookings SET status = 'cancelled' WHERE booking_id = ?`,
      [booking.id]
    )
  }

  // Update available seats count
  const schedule = await query(
    `SELECT * FROM schedules WHERE id = ?`,
    [scheduleId]
  )

  if (schedule.length > 0) {
    const bookedSeats = await query(
      `SELECT COUNT(*) as count FROM seat_bookings WHERE schedule_id = ? AND status = 'booked'`,
      [scheduleId]
    )

    const bookedCount = bookedSeats[0]?.count || 0
    const totalSeats = schedule[0].available_seats + bookedCount

    await execute(
      `UPDATE schedules SET available_seats = ? WHERE id = ?`,
      [totalSeats, scheduleId]
    )
  }

  const schedules = await query(`SELECT * FROM schedules WHERE id = ?`, [scheduleId])
  return { schedule: schedules[0], affectedBookings: bookings }
}

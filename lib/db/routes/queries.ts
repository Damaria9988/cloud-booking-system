/**
 * Route query operations (read-only)
 * Handles all route-related read operations
 */

import { query } from '../connection'
import { convertSeatToUI, convertSeatToNumeric, generateAllSeats } from './utils'

/**
 * Get routes with optional filters
 */
export async function getRoutes(filters?: {
  fromCity?: string
  toCity?: string
  fromState?: string
  toState?: string
  fromCountry?: string
  toCountry?: string
  date?: string
  vehicleType?: string
  transportType?: string
}) {
  const hasDateFilter = !!filters?.date
  const params: any[] = []
  
  // Use scalar subqueries in SELECT to get schedule info (most reliable in SQLite)
  let sql = ``
  
  if (hasDateFilter) {
    sql = `
    SELECT 
      r.*, 
      o.name as operator_name, 
      o.rating, 
      o.total_reviews,
      (SELECT MIN(s.id) FROM schedules s WHERE s.route_id = r.id AND s.is_cancelled = 0 AND s.travel_date = date(?)) as schedule_id,
      (SELECT s.travel_date FROM schedules s WHERE s.route_id = r.id AND s.is_cancelled = 0 AND s.travel_date = date(?) ORDER BY s.id LIMIT 1) as travel_date,
      (SELECT COUNT(*) FROM seat_bookings sb 
       WHERE sb.schedule_id = (SELECT MIN(s2.id) FROM schedules s2 WHERE s2.route_id = r.id AND s2.is_cancelled = 0 AND s2.travel_date = date(?)) 
       AND sb.status = 'booked') as booked_seats_count
    FROM routes r
    INNER JOIN operators o ON r.operator_id = o.id
    WHERE r.status = 'active'`
    params.push(filters.date)
    params.push(filters.date)
    params.push(filters.date)
  } else {
    // No date filter: get first upcoming schedule for each route, fallback to any schedule
    sql = `
    SELECT 
      r.*, 
      o.name as operator_name, 
      o.rating, 
      o.total_reviews,
      COALESCE(
        (SELECT MIN(s.id) FROM schedules s WHERE s.route_id = r.id AND s.is_cancelled = 0 AND s.travel_date >= date('now')),
        (SELECT MIN(s.id) FROM schedules s WHERE s.route_id = r.id AND s.is_cancelled = 0)
      ) as schedule_id,
      COALESCE(
        (SELECT s.travel_date FROM schedules s WHERE s.route_id = r.id AND s.is_cancelled = 0 AND s.travel_date >= date('now') ORDER BY s.travel_date ASC LIMIT 1),
        (SELECT s.travel_date FROM schedules s WHERE s.route_id = r.id AND s.is_cancelled = 0 ORDER BY s.travel_date DESC LIMIT 1)
      ) as travel_date,
      (SELECT COUNT(*) FROM seat_bookings sb 
       WHERE sb.schedule_id = COALESCE(
         (SELECT MIN(s2.id) FROM schedules s2 WHERE s2.route_id = r.id AND s2.is_cancelled = 0 AND s2.travel_date >= date('now')),
         (SELECT MIN(s2.id) FROM schedules s2 WHERE s2.route_id = r.id AND s2.is_cancelled = 0)
       )
       AND sb.status = 'booked') as booked_seats_count
    FROM routes r
    INNER JOIN operators o ON r.operator_id = o.id
    WHERE r.status = 'active'`
  }

  // Use indexed columns - avoid LOWER() and use COLLATE NOCASE for case-insensitive search
  // Trim and normalize city names for better matching
  if (filters?.fromCity) {
    // Remove % signs if already present, then trim
    let fromCity = filters.fromCity.replace(/^%+|%+$/g, '').trim()
    // If empty after trimming, skip this filter
    if (fromCity) {
      // Use LIKE with wildcards for partial matching, case-insensitive
      params.push(`%${fromCity}%`)
      sql += ` AND r.from_city LIKE ? COLLATE NOCASE`
    }
  }
  if (filters?.toCity) {
    let toCity = filters.toCity.replace(/^%+|%+$/g, '').trim()
    if (toCity) {
      // Use LIKE with wildcards for partial matching, case-insensitive
      params.push(`%${toCity}%`)
      sql += ` AND r.to_city LIKE ? COLLATE NOCASE`
    }
  }
  if (filters?.fromState) {
    let fromState = filters.fromState.replace(/^%+|%+$/g, '').trim()
    if (fromState) {
      params.push(`%${fromState}%`)
      sql += ` AND r.from_state LIKE ? COLLATE NOCASE`
    }
  }
  if (filters?.toState) {
    let toState = filters.toState.replace(/^%+|%+$/g, '').trim()
    if (toState) {
      params.push(`%${toState}%`)
      sql += ` AND r.to_state LIKE ? COLLATE NOCASE`
    }
  }
  if (filters?.fromCountry) {
    let fromCountry = filters.fromCountry.replace(/^%+|%+$/g, '').trim()
    if (fromCountry) {
      params.push(`%${fromCountry}%`)
      sql += ` AND (r.from_country LIKE ? COLLATE NOCASE OR r.from_country IS NULL)`
    }
  }
  if (filters?.toCountry) {
    let toCountry = filters.toCountry.replace(/^%+|%+$/g, '').trim()
    if (toCountry) {
      params.push(`%${toCountry}%`)
      sql += ` AND (r.to_country LIKE ? COLLATE NOCASE OR r.to_country IS NULL)`
    }
  }
  if (filters?.transportType) {
    params.push(filters.transportType)
    sql += ` AND COALESCE(r.transport_type, 'bus') = ?`
  }
  if (filters?.vehicleType) {
    params.push(filters.vehicleType)
    sql += ` AND r.vehicle_type = ?`
  }

  sql += " ORDER BY r.id, r.departure_time LIMIT 500"

  const results = await query(sql, params)
  return results
}

/**
 * Get route by ID
 */
export async function getRouteById(routeId: number) {
  const result = await query(
    `SELECT r.*, o.name as operator_name, o.rating, o.total_reviews, o.email as operator_email, o.phone as operator_phone
     FROM routes r
     JOIN operators o ON r.operator_id = o.id
     WHERE r.id = ? AND r.status = 'active'`,
    [routeId]
  )
  return result[0] || null
}

/**
 * Get schedules for a specific route
 */
export async function getSchedulesByRoute(routeId: number, date?: string) {
  // Get today's date to filter out past schedules
  const today = new Date().toISOString().split('T')[0]
  
  let sql = `
    SELECT s.*, r.total_seats,
           (SELECT COUNT(*) FROM seat_bookings sb WHERE sb.schedule_id = s.id AND sb.status = 'booked') as booked_seats
    FROM schedules s
    JOIN routes r ON s.route_id = r.id
    WHERE s.route_id = ? AND s.is_cancelled = 0
  `
  const params: any[] = [routeId]

  if (date) {
    // If specific date is requested, use that date (but still must be >= today)
    params.push(date, today)
    sql += ` AND s.travel_date = date(?) AND s.travel_date >= date(?)`
  } else {
    // If no date specified, only show future schedules (today and onwards)
    params.push(today)
    sql += ` AND s.travel_date >= date(?)`
  }

  sql += `
    ORDER BY s.travel_date ASC
  `

  return query(sql, params)
}

/**
 * Get seat availability for a schedule
 */
export async function getSeatAvailability(scheduleId: number) {
  // Get all booked seats for this schedule
  const bookedSeats = await query(
    `SELECT seat_number, status
     FROM seat_bookings
     WHERE schedule_id = ? AND status = 'booked'`,
    [scheduleId]
  )

  // Get schedule info to know total seats
  const schedule = await query(
    `SELECT s.*, r.total_seats
     FROM schedules s
     JOIN routes r ON s.route_id = r.id
     WHERE s.id = ?`,
    [scheduleId]
  )

  if (schedule.length === 0) {
    return { availableSeats: [], bookedSeats: [] }
  }

  const totalSeats = schedule[0].total_seats
  const bookedSeatNumbersRaw = bookedSeats.map((s: any) => s.seat_number)

  // Convert all booked seats to UI format for consistent return
  const bookedSeatsUI = bookedSeatNumbersRaw.map((seat: string) => convertSeatToUI(seat, totalSeats))
  
  // Convert all booked seats to numeric format for consistent comparison
  const bookedSeatNumbersNumeric = bookedSeatNumbersRaw.map((seat: string) => convertSeatToNumeric(seat, totalSeats))

  // Generate list of all seats in numeric format (1 to total_seats)
  const allSeats = generateAllSeats(totalSeats)

  // Filter out booked seats (compare in numeric format)
  const availableSeats = allSeats.filter((seat) => !bookedSeatNumbersNumeric.includes(seat))

  // Always return booked seats in UI format for frontend consistency
  return {
    availableSeats,
    bookedSeats: bookedSeatsUI, // Always return in UI format (e.g., "A3", "B3", "A4")
    totalSeats,
    availableCount: availableSeats.length,
    bookedCount: bookedSeatsUI.length,
  }
}

/**
 * Get popular routes (based on booking count)
 */
export async function getPopularRoutes() {
  return query(`
    SELECT 
      r.id,
      r.from_city,
      r.from_state,
      r.to_city,
      r.to_state,
      COUNT(b.id) as booking_count
    FROM routes r
    LEFT JOIN bookings b ON r.id = b.route_id
    WHERE r.status = 'active'
    GROUP BY r.id, r.from_city, r.from_state, r.to_city, r.to_state
    ORDER BY booking_count DESC
    LIMIT 10
  `)
}

/**
 * Get all routes (admin)
 */
export async function getAllRoutes() {
  return query(
    `SELECT r.*, o.name as operator_name, o.email as operator_email, o.phone as operator_phone
     FROM routes r
     JOIN operators o ON r.operator_id = o.id
     ORDER BY r.created_at DESC`
  )
}

/**
 * Check if route with same combination exists
 */
export async function checkRouteExists(
  fromCity: string,
  fromState: string,
  toCity: string,
  toState: string,
  operatorId: number,
  departureTime: string,
  excludeId?: number,
  fromCountry?: string,
  toCountry?: string
): Promise<boolean> {
  let sql = `
    SELECT id FROM routes 
    WHERE LOWER(TRIM(from_city)) = LOWER(TRIM(?))
      AND LOWER(TRIM(from_state)) = LOWER(TRIM(?))
      AND LOWER(TRIM(to_city)) = LOWER(TRIM(?))
      AND LOWER(TRIM(to_state)) = LOWER(TRIM(?))
      AND operator_id = ?
      AND departure_time = ?
  `
  const params: any[] = [fromCity, fromState, toCity, toState, operatorId, departureTime]
  
  // Add country checks if provided (for better duplicate detection)
  if (fromCountry) {
    sql += ` AND (from_country IS NULL OR LOWER(TRIM(from_country)) = LOWER(TRIM(?)))`
    params.push(fromCountry)
  } else {
    sql += ` AND from_country IS NULL`
  }
  
  if (toCountry) {
    sql += ` AND (to_country IS NULL OR LOWER(TRIM(to_country)) = LOWER(TRIM(?)))`
    params.push(toCountry)
  } else {
    sql += ` AND to_country IS NULL`
  }
  
  if (excludeId) {
    sql += ` AND id != ?`
    params.push(excludeId)
  }
  
  const result = await query(sql, params)
  return result.length > 0
}

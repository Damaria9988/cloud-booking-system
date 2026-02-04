/**
 * Route mutation operations (write)
 * Handles all route-related create, update, delete operations
 */

import { query, execute } from '../connection'

/**
 * Create a recurring schedule for a route
 */
export async function createRecurringScheduleForRoute(
  routeId: number, 
  departureTime: string, 
  arrivalTime: string,
  totalSeats: number,
  basePrice: number
) {
  const today = new Date()
  const startDate = today.toISOString().split('T')[0]
  
  // End date is 1 year from now
  const endDate = new Date(today)
  endDate.setFullYear(endDate.getFullYear() + 1)
  const endDateStr = endDate.toISOString().split('T')[0]
  
  // Create recurring schedule with daily recurrence
  const result = await execute(
    `INSERT INTO recurring_schedules (
      route_id, recurrence_type, recurrence_days, start_date, end_date,
      departure_time, arrival_time, price_override, seat_capacity_override, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      routeId,
      'daily',
      null, // null means all days for daily recurrence
      startDate,
      endDateStr,
      departureTime,
      arrivalTime,
      basePrice,
      totalSeats,
      'active',
    ]
  )
  
  return Number(result.lastInsertRowid)
}

/**
 * Generate schedules from a recurring schedule
 */
export async function generateSchedulesFromRecurring(recurringScheduleId: number, daysAhead: number = 30) {
  // Get the recurring schedule
  const recurringSchedules = await query(
    `SELECT rs.*, r.total_seats, r.base_price 
     FROM recurring_schedules rs
     JOIN routes r ON rs.route_id = r.id
     WHERE rs.id = ? AND rs.status = 'active'`,
    [recurringScheduleId]
  )
  
  if (recurringSchedules.length === 0) {
    throw new Error('Recurring schedule not found or inactive')
  }
  
  const rs = recurringSchedules[0]
  const routeId = rs.route_id
  const totalSeats = rs.seat_capacity_override || rs.total_seats
  const recurrenceDays = rs.recurrence_days ? JSON.parse(rs.recurrence_days) : null
  
  const today = new Date()
  const startDate = new Date(rs.start_date) > today ? new Date(rs.start_date) : today
  const endDate = new Date(rs.end_date)
  
  const schedulesCreated: number[] = []
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  
  for (let i = 0; i < daysAhead; i++) {
    const scheduleDate = new Date(startDate)
    scheduleDate.setDate(startDate.getDate() + i)
    
    // Don't go past end date
    if (scheduleDate > endDate) break
    
    const dateStr = scheduleDate.toISOString().split('T')[0]
    const dayOfWeek = dayNames[scheduleDate.getDay()]
    
    // Check if this day matches recurrence pattern
    if (rs.recurrence_type === 'daily' || 
        (rs.recurrence_type === 'weekly' && recurrenceDays && recurrenceDays.includes(dayOfWeek))) {
      
      try {
        // Check if schedule already exists
        const existing = await query(
          `SELECT id FROM schedules WHERE route_id = ? AND travel_date = date(?)`,
          [routeId, dateStr]
        )
        
        if (existing.length === 0) {
          const result = await execute(
            `INSERT INTO schedules (route_id, travel_date, available_seats, is_cancelled)
             VALUES (?, date(?), ?, 0)`,
            [routeId, dateStr, totalSeats]
          )
          schedulesCreated.push(Number(result.lastInsertRowid))
        }
      } catch (err) {
        console.error(`Error creating schedule for route ${routeId} on ${dateStr}:`, err)
      }
    }
  }
  
  return schedulesCreated
}

/**
 * Generate schedules for a route for the next N days (simple version)
 */
export async function generateSchedulesForRoute(routeId: number, totalSeats: number, daysAhead: number = 30) {
  const today = new Date()
  const schedulesCreated: number[] = []
  
  for (let i = 0; i < daysAhead; i++) {
    const scheduleDate = new Date(today)
    scheduleDate.setDate(today.getDate() + i)
    const dateStr = scheduleDate.toISOString().split('T')[0] // YYYY-MM-DD format
    
    try {
      // Check if schedule already exists for this date
      const existing = await query(
        `SELECT id FROM schedules WHERE route_id = ? AND travel_date = date(?)`,
        [routeId, dateStr]
      )
      
      if (existing.length === 0) {
        const result = await execute(
          `INSERT INTO schedules (route_id, travel_date, available_seats, is_cancelled)
           VALUES (?, date(?), ?, 0)`,
          [routeId, dateStr, totalSeats]
        )
        schedulesCreated.push(Number(result.lastInsertRowid))
      }
    } catch (err) {
      // Skip if schedule exists or other error
      console.error(`Error creating schedule for route ${routeId} on ${dateStr}:`, err)
    }
  }
  
  return schedulesCreated
}
import { getRouteById, checkRouteExists } from './queries'

/**
 * Create a new route
 */
export async function createRoute(data: {
  operatorId: number
  fromCity: string
  fromState: string
  toCity: string
  toState: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  vehicleType: string
  totalSeats: number
  basePrice: number
  amenities?: string[]
  status?: string
  transportType?: string
  fromCountry?: string
  toCountry?: string
}) {
  // Normalize input data for duplicate checking
  const normalizedFromCity = data.fromCity.trim()
  const normalizedFromState = data.fromState.trim()
  const normalizedToCity = data.toCity.trim()
  const normalizedToState = data.toState.trim()
  const normalizedDepartureTime = data.departureTime.trim()
  const normalizedFromCountry = data.fromCountry?.trim() || null
  const normalizedToCountry = data.toCountry?.trim() || null
  
  // Check for duplicate route
  const exists = await checkRouteExists(
    normalizedFromCity,
    normalizedFromState,
    normalizedToCity,
    normalizedToState,
    data.operatorId,
    normalizedDepartureTime,
    undefined,
    normalizedFromCountry || undefined,
    normalizedToCountry || undefined
  )
  if (exists) {
    throw new Error(
      `Route already exists: ${normalizedFromCity}, ${normalizedFromState}${normalizedFromCountry ? `, ${normalizedFromCountry}` : ''} → ${normalizedToCity}, ${normalizedToState}${normalizedToCountry ? `, ${normalizedToCountry}` : ''} ` +
      `with operator ${data.operatorId} at ${normalizedDepartureTime}`
    )
  }

  const result = await execute(
    `INSERT INTO routes (
      operator_id, from_city, from_state, from_country, to_city, to_state, to_country,
      departure_time, arrival_time, duration_minutes, vehicle_type,
      total_seats, base_price, amenities, status, transport_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.operatorId,
      normalizedFromCity,
      normalizedFromState,
      normalizedFromCountry,
      normalizedToCity,
      normalizedToState,
      normalizedToCountry,
      normalizedDepartureTime,
      data.arrivalTime.trim(),
      data.durationMinutes,
      data.vehicleType.trim(),
      data.totalSeats,
      data.basePrice,
      data.amenities ? JSON.stringify(data.amenities) : null,
      data.status || 'active',
      data.transportType || 'bus',
    ]
  )
  
  const routeId = Number(result.lastInsertRowid)
  
  // Auto-create recurring schedule (daily, 1 year) and generate initial schedules
  try {
    // Create recurring schedule
    const recurringScheduleId = await createRecurringScheduleForRoute(
      routeId,
      normalizedDepartureTime,
      data.arrivalTime.trim(),
      data.totalSeats,
      data.basePrice
    )
    console.log(`[ROUTE] Created recurring schedule ${recurringScheduleId} for route ${routeId}`)
    
    // Generate schedules from the recurring schedule
    const schedulesCreated = await generateSchedulesFromRecurring(recurringScheduleId, 30)
    console.log(`[ROUTE] Created ${schedulesCreated.length} schedules from recurring schedule for route ${routeId}`)
  } catch (scheduleErr) {
    console.error(`[ROUTE] Error creating recurring schedule for route ${routeId}:`, scheduleErr)
    // Fallback to simple schedule generation
    try {
      const schedulesCreated = await generateSchedulesForRoute(routeId, data.totalSeats, 30)
      console.log(`[ROUTE] Fallback: Created ${schedulesCreated.length} simple schedules for route ${routeId}`)
    } catch (fallbackErr) {
      console.error(`[ROUTE] Fallback also failed for route ${routeId}:`, fallbackErr)
    }
  }
  
  const routes = await query("SELECT * FROM routes WHERE id = ?", [routeId])
  return routes
}

/**
 * Update an existing route
 */
export async function updateRoute(routeId: number, data: {
  operatorId?: number
  fromCity?: string
  fromState?: string
  fromCountry?: string
  toCity?: string
  toState?: string
  toCountry?: string
  departureTime?: string
  arrivalTime?: string
  durationMinutes?: number
  vehicleType?: string
  totalSeats?: number
  basePrice?: number
  amenities?: string[]
  status?: string
  transportType?: string
}) {
  // Get current route to check for duplicates with updated values
  const currentRoute = await getRouteById(routeId)
  if (!currentRoute) {
    throw new Error("Route not found")
  }

  // Use updated values or fall back to current values for duplicate check
  const fromCity = data.fromCity ?? currentRoute.from_city
  const fromState = data.fromState ?? currentRoute.from_state
  const fromCountry = data.fromCountry ?? currentRoute.from_country ?? undefined
  const toCity = data.toCity ?? currentRoute.to_city
  const toState = data.toState ?? currentRoute.to_state
  const toCountry = data.toCountry ?? currentRoute.to_country ?? undefined
  const operatorId = data.operatorId ?? currentRoute.operator_id
  const departureTime = data.departureTime ?? currentRoute.departure_time

  // Check for duplicate route (excluding current route)
  const exists = await checkRouteExists(
    fromCity,
    fromState,
    toCity,
    toState,
    operatorId,
    departureTime,
    routeId,
    fromCountry,
    toCountry
  )
  if (exists) {
    throw new Error(
      `Route already exists: ${fromCity}, ${fromState}${fromCountry ? `, ${fromCountry}` : ''} → ${toCity}, ${toState}${toCountry ? `, ${toCountry}` : ''} ` +
      `with operator ${operatorId} at ${departureTime}`
    )
  }

  const updates: string[] = []
  const params: any[] = []

  if (data.operatorId !== undefined) {
    updates.push(`operator_id = ?`)
    params.push(data.operatorId)
  }
  if (data.fromCity !== undefined) {
    updates.push(`from_city = ?`)
    params.push(data.fromCity)
  }
  if (data.fromState !== undefined) {
    updates.push(`from_state = ?`)
    params.push(data.fromState)
  }
  if (data.fromCountry !== undefined) {
    updates.push(`from_country = ?`)
    params.push(data.fromCountry || null)
  }
  if (data.toCity !== undefined) {
    updates.push(`to_city = ?`)
    params.push(data.toCity)
  }
  if (data.toState !== undefined) {
    updates.push(`to_state = ?`)
    params.push(data.toState)
  }
  if (data.toCountry !== undefined) {
    updates.push(`to_country = ?`)
    params.push(data.toCountry || null)
  }
  if (data.departureTime !== undefined) {
    updates.push(`departure_time = ?`)
    params.push(data.departureTime)
  }
  if (data.arrivalTime !== undefined) {
    updates.push(`arrival_time = ?`)
    params.push(data.arrivalTime)
  }
  if (data.durationMinutes !== undefined) {
    updates.push(`duration_minutes = ?`)
    params.push(data.durationMinutes)
  }
  if (data.vehicleType !== undefined) {
    updates.push(`vehicle_type = ?`)
    params.push(data.vehicleType)
  }
  if (data.totalSeats !== undefined) {
    updates.push(`total_seats = ?`)
    params.push(data.totalSeats)
  }
  if (data.basePrice !== undefined) {
    updates.push(`base_price = ?`)
    params.push(data.basePrice)
  }
  if (data.amenities !== undefined) {
    updates.push(`amenities = ?`)
    params.push(data.amenities ? JSON.stringify(data.amenities) : null)
  }
  if (data.status !== undefined) {
    updates.push(`status = ?`)
    params.push(data.status)
  }
  if (data.transportType !== undefined) {
    updates.push(`transport_type = ?`)
    params.push(data.transportType)
  }

  if (updates.length === 0) {
    return query(`SELECT * FROM routes WHERE id = ?`, [routeId])
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`)
  params.push(routeId)

  await execute(
    `UPDATE routes SET ${updates.join(', ')} WHERE id = ?`,
    params
  )
  const routes = await query("SELECT * FROM routes WHERE id = ?", [routeId])
  return routes
}

/**
 * Delete a route (soft delete - sets status to inactive)
 */
export async function deleteRoute(routeId: number) {
  // Check if route has active bookings
  const bookings = await query(
    `SELECT COUNT(*) as count FROM bookings WHERE route_id = ? AND booking_status != 'cancelled'`,
    [routeId]
  )

  if (bookings[0]?.count > 0) {
    throw new Error('Cannot delete route with active bookings')
  }

  await execute(
    `UPDATE routes SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [routeId]
  )
  const routes = await query("SELECT * FROM routes WHERE id = ?", [routeId])
  return routes
}

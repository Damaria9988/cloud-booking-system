/**
 * Recurring schedule database operations
 * Handles recurring schedule management and price rules
 */

import { query, execute } from './connection'

/**
 * Get all recurring schedules
 */
export async function getAllRecurringSchedules() {
  return query(
    `SELECT rs.*, r.from_city, r.from_state, r.to_city, r.to_state, o.name as operator_name
     FROM recurring_schedules rs
     JOIN routes r ON rs.route_id = r.id
     JOIN operators o ON r.operator_id = o.id
     ORDER BY rs.created_at DESC`
  )
}

/**
 * Get recurring schedule by ID
 */
export async function getRecurringScheduleById(scheduleId: number) {
  const result = await query(
    `SELECT * FROM recurring_schedules WHERE id = ?`,
    [scheduleId]
  )
  return result[0] || null
}

/**
 * Create a recurring schedule
 */
export async function createRecurringSchedule(data: {
  routeId: number
  recurrenceType: string
  recurrenceDays?: string[]
  startDate: string
  endDate: string
  departureTime: string
  arrivalTime: string
  priceOverride?: number
  seatCapacityOverride?: number
  status?: string
}) {
  const result = await execute(
    `INSERT INTO recurring_schedules (
      route_id, recurrence_type, recurrence_days, start_date, end_date,
      departure_time, arrival_time, price_override, seat_capacity_override, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.routeId,
      data.recurrenceType,
      data.recurrenceDays ? JSON.stringify(data.recurrenceDays) : null,
      data.startDate,
      data.endDate,
      data.departureTime,
      data.arrivalTime,
      data.priceOverride || null,
      data.seatCapacityOverride || null,
      data.status || 'active',
    ]
  )
  const schedules = await query("SELECT * FROM recurring_schedules WHERE id = ?", [result.lastInsertRowid])
  return schedules
}

/**
 * Update a recurring schedule
 */
export async function updateRecurringSchedule(scheduleId: number, data: {
  routeId?: number
  recurrenceType?: string
  recurrenceDays?: string[]
  startDate?: string
  endDate?: string
  departureTime?: string
  arrivalTime?: string
  priceOverride?: number
  seatCapacityOverride?: number
  status?: string
}) {
  const updates: string[] = []
  const params: any[] = []

  if (data.routeId !== undefined) {
    updates.push(`route_id = ?`)
    params.push(data.routeId)
  }
  if (data.recurrenceType !== undefined) {
    updates.push(`recurrence_type = ?`)
    params.push(data.recurrenceType)
  }
  if (data.recurrenceDays !== undefined) {
    updates.push(`recurrence_days = ?`)
    params.push(data.recurrenceDays ? JSON.stringify(data.recurrenceDays) : null)
  }
  if (data.startDate !== undefined) {
    updates.push(`start_date = ?`)
    params.push(data.startDate)
  }
  if (data.endDate !== undefined) {
    updates.push(`end_date = ?`)
    params.push(data.endDate)
  }
  if (data.departureTime !== undefined) {
    updates.push(`departure_time = ?`)
    params.push(data.departureTime)
  }
  if (data.arrivalTime !== undefined) {
    updates.push(`arrival_time = ?`)
    params.push(data.arrivalTime)
  }
  if (data.priceOverride !== undefined) {
    updates.push(`price_override = ?`)
    params.push(data.priceOverride || null)
  }
  if (data.seatCapacityOverride !== undefined) {
    updates.push(`seat_capacity_override = ?`)
    params.push(data.seatCapacityOverride || null)
  }
  if (data.status !== undefined) {
    updates.push(`status = ?`)
    params.push(data.status)
  }

  if (updates.length === 0) {
    return query(`SELECT * FROM recurring_schedules WHERE id = ?`, [scheduleId])
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`)
  params.push(scheduleId)

  await execute(
    `UPDATE recurring_schedules SET ${updates.join(', ')} WHERE id = ?`,
    params
  )
  const schedules = await query("SELECT * FROM recurring_schedules WHERE id = ?", [scheduleId])
  return schedules
}

/**
 * Set recurring schedule price rule
 */
export async function setRecurringSchedulePriceRule(
  recurringScheduleId: number,
  dayOfWeek: string | null,
  priceMultiplier?: number,
  fixedPrice?: number
) {
  await execute(
    `INSERT OR REPLACE INTO recurring_schedule_price_rules 
     (recurring_schedule_id, day_of_week, price_multiplier, fixed_price, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [recurringScheduleId, dayOfWeek, priceMultiplier || 1.0, fixedPrice || null]
  )
}

/**
 * Get recurring schedule price rules
 */
export async function getRecurringSchedulePriceRules(recurringScheduleId: number) {
  return query(
    `SELECT * FROM recurring_schedule_price_rules WHERE recurring_schedule_id = ?`,
    [recurringScheduleId]
  )
}

/**
 * Delete recurring schedule price rule
 */
export async function deleteRecurringSchedulePriceRule(ruleId: number) {
  await execute(
    `DELETE FROM recurring_schedule_price_rules WHERE id = ?`,
    [ruleId]
  )
}

/**
 * Price override database operations
 * Handles dynamic pricing and date-specific price overrides
 */

import { query, execute } from './connection'
import { getRouteById } from './routes'
import { isHoliday } from './holidays'

/**
 * Set date-specific price override
 */
export async function setDatePriceOverride(
  routeId: number,
  travelDate: string,
  price: number,
  reason?: string
) {
  await execute(
    `INSERT OR REPLACE INTO date_price_overrides (route_id, travel_date, price_override, reason, updated_at)
     VALUES (?, date(?), ?, ?, CURRENT_TIMESTAMP)`,
    [routeId, travelDate, price, reason || 'manual']
  )
}

/**
 * Get date-specific price override
 */
export async function getDatePriceOverride(routeId: number, travelDate: string) {
  const result = await query(
    `SELECT * FROM date_price_overrides WHERE route_id = ? AND travel_date = date(?)`,
    [routeId, travelDate]
  )
  return result[0] || null
}

/**
 * Delete date-specific price override
 */
export async function deleteDatePriceOverride(routeId: number, travelDate: string) {
  await execute(
    `DELETE FROM date_price_overrides WHERE route_id = ? AND travel_date = date(?)`,
    [routeId, travelDate]
  )
}

/**
 * Calculate final price for a schedule considering all pricing factors
 */
export async function calculateSchedulePrice(
  routeId: number,
  travelDate: string,
  recurringScheduleId?: number
): Promise<number> {
  // Get base route price
  const route = await getRouteById(routeId)
  if (!route) {
    throw new Error("Route not found")
  }
  let finalPrice = route.base_price

  // 1. Check for date-specific override (highest priority)
  const dateOverride = await getDatePriceOverride(routeId, travelDate)
  if (dateOverride) {
    return dateOverride.price_override
  }

  // 2. Check for recurring schedule price rules
  if (recurringScheduleId) {
    const dateObj = new Date(travelDate)
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
    
    // Check for day-specific rule
    const dayRule = await query(
      `SELECT * FROM recurring_schedule_price_rules 
       WHERE recurring_schedule_id = ? AND day_of_week = ?`,
      [recurringScheduleId, dayOfWeek]
    )
    
    if (dayRule.length > 0) {
      const rule = dayRule[0]
      if (rule.fixed_price) {
        return rule.fixed_price
      } else {
        finalPrice = route.base_price * rule.price_multiplier
      }
    } else {
      // Check for general rule (no day_of_week specified)
      const generalRule = await query(
        `SELECT * FROM recurring_schedule_price_rules 
         WHERE recurring_schedule_id = ? AND day_of_week IS NULL`,
        [recurringScheduleId]
      )
      
      if (generalRule.length > 0) {
        const rule = generalRule[0]
        if (rule.fixed_price) {
          return rule.fixed_price
        } else {
          finalPrice = route.base_price * rule.price_multiplier
        }
      }
    }
  }

  // 3. Check for holiday pricing
  const holidayCheck = await isHoliday(travelDate)
  if (holidayCheck.isHoliday && holidayCheck.holiday) {
    finalPrice = finalPrice * holidayCheck.holiday.price_multiplier
  }

  // 4. Check for weekend pricing (Saturday/Sunday)
  const dateObj = new Date(travelDate)
  const dayOfWeek = dateObj.getDay() // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // Weekend pricing: 10% increase (can be configured)
    finalPrice = finalPrice * 1.1
  }

  return Math.round(finalPrice * 100) / 100 // Round to 2 decimal places
}

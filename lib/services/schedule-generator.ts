import { db } from "@/lib/db"

interface RecurringSchedule {
  id: number
  route_id: number
  recurrence_type: string
  recurrence_days?: string[]
  start_date: string
  end_date: string
  departure_time: string
  arrival_time: string
  price_override?: number
  seat_capacity_override?: number
}

export class ScheduleGenerator {
  /**
   * Generate schedules from a recurring schedule rule with dynamic pricing
   */
  static async generateFromRecurring(recurringSchedule: RecurringSchedule) {
    const { start_date, end_date, recurrence_type, recurrence_days } = recurringSchedule

    const start = new Date(start_date)
    const end = new Date(end_date)
    const generated: any[] = []

    // Get route details
    const route = await db.getRouteById(recurringSchedule.route_id)
    if (!route) {
      throw new Error("Route not found")
    }

    // Parse recurrence_days if it's a JSON string
    let parsedRecurrenceDays: string[] = []
    if (recurrence_days) {
      if (typeof recurrence_days === 'string') {
        try {
          parsedRecurrenceDays = JSON.parse(recurrence_days)
        } catch {
          parsedRecurrenceDays = []
        }
      } else {
        parsedRecurrenceDays = recurrence_days
      }
    }

    // Iterate through each date in the range
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split("T")[0]
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" })

      // Check if this date matches the recurrence pattern
      let shouldGenerate = false

      if (recurrence_type === "daily") {
        shouldGenerate = true
      } else if (recurrence_type === "weekly" && parsedRecurrenceDays.length > 0) {
        shouldGenerate = parsedRecurrenceDays.includes(dayName)
      }

      if (!shouldGenerate) {
        continue
      }

      // Check if schedule already exists (prevent duplicates)
      const existing = await db.query(
        `SELECT id FROM schedules WHERE route_id = ? AND travel_date = date(?)`,
        [recurringSchedule.route_id, dateStr]
      )

      if (existing.length > 0) {
        continue // Skip if already exists
      }

      // Get seat capacity (use override if provided, otherwise use route default)
      const seatCapacity =
        recurringSchedule.seat_capacity_override || route.total_seats

      // Calculate dynamic price for this date
      const calculatedPrice = await db.calculateSchedulePrice(
        recurringSchedule.route_id,
        dateStr,
        recurringSchedule.id
      )

      // Store the calculated price as a date override (so it's consistent)
      // This ensures the price doesn't change if pricing rules change later
      await db.setDatePriceOverride(
        recurringSchedule.route_id,
        dateStr,
        calculatedPrice,
        'recurring_schedule'
      )

      // Create schedule
      try {
        const result = await db.createSchedule({
          routeId: recurringSchedule.route_id,
          travelDate: dateStr,
          availableSeats: seatCapacity,
          isCancelled: false,
        })

        if (result && result.length > 0) {
          generated.push(result[0])
        }
      } catch (error: any) {
        // Ignore "already exists" errors
        if (!error.message?.includes('already exists')) {
          console.error(`Error generating schedule for ${dateStr}:`, error)
        }
        // Continue with next date
      }
    }

    return generated
  }

  /**
   * Generate schedules for all active recurring rules
   */
  static async generateAllActive() {
    const recurringSchedules = await db.query(
      `SELECT * FROM recurring_schedules WHERE status = 'active'`
    )

    const results = []
    for (const rule of recurringSchedules) {
      try {
        const generated = await this.generateFromRecurring(rule)
        results.push({ ruleId: rule.id, count: generated.length })
      } catch (error) {
        console.error(`Error generating schedules for rule ${rule.id}:`, error)
      }
    }

    return results
  }

  /**
   * Generate schedules for a specific date range (useful for on-demand generation)
   */
  static async generateForDateRange(recurringScheduleId: number, startDate: string, endDate: string) {
    const recurringSchedule = await db.getRecurringScheduleById(recurringScheduleId)
    if (!recurringSchedule) {
      throw new Error("Recurring schedule not found")
    }

    // Temporarily override dates for generation
    const originalStart = recurringSchedule.start_date
    const originalEnd = recurringSchedule.end_date
    
    recurringSchedule.start_date = startDate
    recurringSchedule.end_date = endDate

    const generated = await this.generateFromRecurring(recurringSchedule)

    // Restore original dates
    recurringSchedule.start_date = originalStart
    recurringSchedule.end_date = originalEnd

    return generated
  }
}


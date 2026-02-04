import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db/connection"
import { 
  generateSchedulesForRoute, 
  createRecurringScheduleForRoute, 
  generateSchedulesFromRecurring 
} from "@/lib/db/routes/mutations"
import { requireAdmin } from "@/lib/get-user"

// POST /api/admin/generate-schedules - Generate recurring schedules for all routes
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    // Get all active routes with their details
    interface RouteData {
      id: number
      total_seats: number
      departure_time: string
      arrival_time: string
      base_price: number
    }
    const routes = await query<RouteData>(
      `SELECT id, total_seats, departure_time, arrival_time, base_price 
       FROM routes WHERE status = 'active'`
    ) as RouteData[]

    let totalSchedulesCreated = 0
    let recurringSchedulesCreated = 0
    const routesUpdated: number[] = []
    const errors: string[] = []

    for (const route of routes) {
      try {
        // Check if route already has a recurring schedule
        const existingRecurring = await query<{ id: number }>(
          `SELECT id FROM recurring_schedules WHERE route_id = ? AND status = 'active'`,
          [route.id]
        ) as { id: number }[]

        let recurringScheduleId: number

        if (existingRecurring.length === 0) {
          // Create recurring schedule for this route
          recurringScheduleId = await createRecurringScheduleForRoute(
            route.id,
            route.departure_time,
            route.arrival_time,
            route.total_seats,
            route.base_price
          )
          recurringSchedulesCreated++
          console.log(`[GENERATE] Created recurring schedule ${recurringScheduleId} for route ${route.id}`)
        } else {
          recurringScheduleId = existingRecurring[0].id
        }

        // Check if route has any upcoming schedules
        const existingSchedules = await query<{ count: number }>(
          `SELECT COUNT(*) as count FROM schedules 
           WHERE route_id = ? AND travel_date >= date('now') AND is_cancelled = 0`,
          [route.id]
        ) as { count: number }[]

        const scheduleCount = existingSchedules[0]?.count || 0

        // If fewer than 30 upcoming schedules, generate more
        if (scheduleCount < 30) {
          const schedulesCreated = await generateSchedulesFromRecurring(recurringScheduleId, 30)
          totalSchedulesCreated += schedulesCreated.length
          if (schedulesCreated.length > 0) {
            routesUpdated.push(route.id)
          }
        }
      } catch (err: any) {
        errors.push(`Route ${route.id}: ${err.message}`)
        // Try fallback simple generation
        try {
          const schedulesCreated = await generateSchedulesForRoute(route.id, route.total_seats, 30)
          totalSchedulesCreated += schedulesCreated.length
          if (schedulesCreated.length > 0) {
            routesUpdated.push(route.id)
          }
        } catch (fallbackErr: any) {
          errors.push(`Route ${route.id} fallback: ${fallbackErr.message}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${recurringSchedulesCreated} recurring schedules and ${totalSchedulesCreated} schedules for ${routesUpdated.length} routes`,
      recurringSchedulesCreated,
      totalSchedulesCreated,
      routesUpdated,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Generate schedules error:", error)
    return NextResponse.json({ error: "Failed to generate schedules" }, { status: 500 })
  }
}

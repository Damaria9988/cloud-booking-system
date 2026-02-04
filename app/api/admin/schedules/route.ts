import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"
import { broadcastScheduleCreated } from "@/lib/websocket-broadcast"

// GET /api/admin/schedules - Get all schedules with filters
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const routeId = searchParams.get("routeId")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const isCancelled = searchParams.get("isCancelled")

    const filters: any = {}
    if (routeId) filters.routeId = parseInt(routeId)
    if (dateFrom) filters.dateFrom = dateFrom
    if (dateTo) filters.dateTo = dateTo
    if (isCancelled !== null) filters.isCancelled = isCancelled === "true"

    const schedules = await db.getAllSchedules(filters)
    console.log(`Fetched ${schedules.length} schedules with filters:`, filters)
    return NextResponse.json({ schedules })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Get schedules error:", error)
    console.error("Error stack:", error.stack)
    return NextResponse.json({ 
      error: "Failed to fetch schedules",
      details: error.message 
    }, { status: 500 })
  }
}

// POST /api/admin/schedules - Create new schedule
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { routeId, travelDate, availableSeats, isCancelled } = body

    if (!routeId || !travelDate) {
      return NextResponse.json(
        { error: "Route ID and travel date are required" },
        { status: 400 }
      )
    }

    // Check for duplicate schedule
    const scheduleExists = await db.checkScheduleExists(routeId, travelDate)
    if (scheduleExists) {
      return NextResponse.json(
        { error: "Schedule already exists for this route and date" },
        { status: 400 }
      )
    }

    const result = await db.createSchedule({
      routeId,
      travelDate,
      availableSeats,
      isCancelled,
    })

    // Broadcast to connected clients (users will see new schedule immediately)
    broadcastScheduleCreated(result[0])

    return NextResponse.json({ schedule: result[0] }, { status: 201 })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error.message.includes("already exists") || error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Create schedule error:", error)
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 })
  }
}


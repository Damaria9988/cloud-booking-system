import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"
import { ScheduleGenerator } from "@/lib/services/schedule-generator"
import { broadcastSchedulesGenerated } from "@/lib/websocket-broadcast"

// POST /api/admin/recurring-schedules/[id]/generate - Generate schedules from recurring rule
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const scheduleId = parseInt(params.id)
    if (isNaN(scheduleId)) {
      return NextResponse.json({ error: "Invalid schedule ID" }, { status: 400 })
    }

    // Get recurring schedule
    const recurringSchedules = await db.query(
      `SELECT * FROM recurring_schedules WHERE id = ?`,
      [scheduleId]
    )

    if (recurringSchedules.length === 0) {
      return NextResponse.json({ error: "Recurring schedule not found" }, { status: 404 })
    }

    const recurringSchedule = recurringSchedules[0]

    // Generate schedules
    const generated = await ScheduleGenerator.generateFromRecurring(recurringSchedule)

    // Broadcast to connected clients
    try {
      broadcastSchedulesGenerated(scheduleId, generated.length, generated)
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError)
      // Don't fail the request if broadcast fails
    }

    return NextResponse.json({
      message: `Generated ${generated.length} schedules`,
      count: generated.length,
      schedules: generated,
    })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Generate schedules error:", error)
    return NextResponse.json({ error: error.message || "Failed to generate schedules" }, { status: 500 })
  }
}


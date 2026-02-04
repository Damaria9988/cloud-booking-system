import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"
import { broadcastRecurringScheduleUpdated, broadcastRecurringScheduleDeleted } from "@/lib/websocket-broadcast"

// PATCH /api/admin/recurring-schedules/[id] - Update recurring schedule
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const scheduleId = parseInt(params.id)
    if (isNaN(scheduleId)) {
      return NextResponse.json({ error: "Invalid schedule ID" }, { status: 400 })
    }

    const body = await request.json()
    const result = await db.updateRecurringSchedule(scheduleId, body)

    if (result.length === 0) {
      return NextResponse.json({ error: "Recurring schedule not found" }, { status: 404 })
    }

    const updatedSchedule = result[0]
    
    // Broadcast to connected clients
    try {
      broadcastRecurringScheduleUpdated(updatedSchedule)
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError)
    }

    return NextResponse.json({ schedule: updatedSchedule })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Update recurring schedule error:", error)
    return NextResponse.json({ error: "Failed to update recurring schedule" }, { status: 500 })
  }
}


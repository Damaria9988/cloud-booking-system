import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"
import { broadcastScheduleCancelled } from "@/lib/websocket-broadcast"

// PATCH /api/admin/schedules/[id]/cancel - Cancel schedule
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

    const result = await db.cancelSchedule(scheduleId)

    if (!result.schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    // Email sending removed - keeping it simple

    // Broadcast real-time updates
    try {
      broadcastScheduleCancelled(scheduleId)
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError)
      // Don't fail the cancellation if WebSocket fails
    }

    return NextResponse.json({
      message: `Schedule cancelled successfully. ${result.affectedBookings.length} booking(s) have been cancelled and refunded.`,
      schedule: result.schedule,
      affectedBookings: result.affectedBookings.length,
    })
  } catch (error: any) {
    // Handle authentication/authorization errors
    if (error?.message === "Unauthorized" || error?.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    
    // Log the error for debugging
    console.error("Cancel schedule error:", error)
    
    // Return user-friendly error message
    const errorMessage = error?.message || "Failed to cancel schedule"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}


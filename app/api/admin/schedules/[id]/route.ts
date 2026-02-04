import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"

// PATCH /api/admin/schedules/[id] - Update schedule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await requireAdmin()

    // Handle both sync and async params (Next.js 13+ vs 15+)
    const resolvedParams = params instanceof Promise ? await params : params
    const idParam = resolvedParams.id
    
    if (!idParam) {
      return NextResponse.json({ error: "Schedule ID is required" }, { status: 400 })
    }
    
    const scheduleId = parseInt(idParam)
    if (isNaN(scheduleId) || scheduleId <= 0) {
      console.error("Invalid schedule ID:", idParam)
      return NextResponse.json({ error: "Invalid schedule ID" }, { status: 400 })
    }

    const body = await request.json()
    const { routeId, travelDate, availableSeats } = body

    if (!routeId || !travelDate) {
      return NextResponse.json(
        { error: "Route ID and travel date are required" },
        { status: 400 }
      )
    }

    // Check if schedule exists
    const existingSchedule = await db.getScheduleByIdAdmin(scheduleId)
    if (!existingSchedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    // Check for duplicate schedule (excluding current schedule)
    const scheduleExists = await db.checkScheduleExists(routeId, travelDate, scheduleId)
    if (scheduleExists) {
      return NextResponse.json(
        { error: "A schedule already exists for this route and date" },
        { status: 400 }
      )
    }

    // Update schedule
    const updates: string[] = []
    const updateParams: any[] = []

    if (routeId !== undefined) {
      updates.push(`route_id = ?`)
      updateParams.push(routeId)
    }
    if (travelDate !== undefined) {
      updates.push(`travel_date = date(?)`)
      updateParams.push(travelDate)
    }
    if (availableSeats !== undefined) {
      updates.push(`available_seats = ?`)
      updateParams.push(availableSeats)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    updateParams.push(scheduleId)

    await db.execute(
      `UPDATE schedules SET ${updates.join(", ")} WHERE id = ?`,
      updateParams
    )

    // Get updated schedule
    const updatedSchedule = await db.getScheduleByIdAdmin(scheduleId)

    return NextResponse.json({ schedule: updatedSchedule })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Update schedule error:", error)
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json({ 
      error: "Failed to update schedule",
      details: error.message 
    }, { status: 500 })
  }
}

// DELETE /api/admin/schedules/[id] - Delete schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await requireAdmin()

    // Handle both sync and async params (Next.js 13+ vs 15+)
    const resolvedParams = params instanceof Promise ? await params : params
    const idParam = resolvedParams.id
    
    if (!idParam) {
      return NextResponse.json({ error: "Schedule ID is required" }, { status: 400 })
    }
    
    const scheduleId = parseInt(idParam)
    if (isNaN(scheduleId) || scheduleId <= 0) {
      console.error("Invalid schedule ID:", idParam)
      return NextResponse.json({ error: "Invalid schedule ID" }, { status: 400 })
    }

    // Check if schedule exists
    const schedule = await db.getScheduleByIdAdmin(scheduleId)
    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    // Check for active bookings
    const bookings = await db.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE schedule_id = ? AND booking_status != 'cancelled'`,
      [scheduleId]
    )

    if (bookings[0]?.count > 0) {
      return NextResponse.json(
        { error: "Cannot delete schedule with active bookings. Please cancel it instead." },
        { status: 400 }
      )
    }

    // Delete schedule
    await db.execute(`DELETE FROM schedules WHERE id = ?`, [scheduleId])

    return NextResponse.json({ message: "Schedule deleted successfully" })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Delete schedule error:", error)
    return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 })
  }
}

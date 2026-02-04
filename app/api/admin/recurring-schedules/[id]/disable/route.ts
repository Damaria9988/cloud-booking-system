import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"

// PATCH /api/admin/recurring-schedules/[id]/disable - Disable recurring schedule
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

    const result = await db.disableRecurringSchedule(scheduleId)

    if (result.length === 0) {
      return NextResponse.json({ error: "Recurring schedule not found" }, { status: 404 })
    }

    return NextResponse.json({ schedule: result[0] })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Disable recurring schedule error:", error)
    return NextResponse.json({ error: "Failed to disable recurring schedule" }, { status: 500 })
  }
}


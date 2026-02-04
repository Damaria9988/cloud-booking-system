import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"

// POST /api/admin/bookings/auto-complete - Auto-complete bookings with past travel dates
// This endpoint can be called by a cron job or scheduled task
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const updatedCount = await db.autoCompletePastBookings()

    return NextResponse.json({
      message: "Auto-completion completed successfully",
      updatedCount,
    })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Auto-complete bookings error:", error)
    return NextResponse.json({ error: "Failed to auto-complete bookings" }, { status: 500 })
  }
}

// GET /api/admin/bookings/auto-complete - Get count of bookings that would be auto-completed
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    // Count bookings that would be auto-completed
    const result = await db.query<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM bookings 
       WHERE travel_date < date('now') 
         AND booking_status NOT IN ('completed', 'cancelled')`
    )

    const count = result[0]?.count || 0

    return NextResponse.json({
      message: "Count of bookings that would be auto-completed",
      count,
    })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Get auto-complete count error:", error)
    return NextResponse.json({ error: "Failed to get auto-complete count" }, { status: 500 })
  }
}

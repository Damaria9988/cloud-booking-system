import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"
import { broadcastHolidayCreated } from "@/lib/websocket-broadcast"

// GET /api/admin/holidays - Get all holidays
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined

    const holidays = await db.getAllHolidays(year)
    return NextResponse.json({ holidays })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Get holidays error:", error)
    return NextResponse.json({ error: "Failed to fetch holidays" }, { status: 500 })
  }
}

// POST /api/admin/holidays - Create holiday
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { name, date, type, isRecurring, priceMultiplier } = body

    if (!name || !date) {
      return NextResponse.json(
        { error: "Name and date are required" },
        { status: 400 }
      )
    }

    const holiday = await db.createHoliday(
      name,
      date,
      type || 'national',
      isRecurring || false,
      priceMultiplier || 1.5
    )

    // Broadcast to connected clients
    try {
      broadcastHolidayCreated(holiday)
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError)
    }

    return NextResponse.json({ holiday }, { status: 201 })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error.message?.includes("UNIQUE constraint")) {
      return NextResponse.json(
        { error: "Holiday with this name and date already exists" },
        { status: 400 }
      )
    }
    console.error("Create holiday error:", error)
    return NextResponse.json({ error: "Failed to create holiday" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const routeId = parseInt(id)
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date")

    if (isNaN(routeId)) {
      return NextResponse.json(
        { error: "Invalid route ID" },
        { status: 400 }
      )
    }

    const schedules = await db.getSchedulesByRoute(routeId, date || undefined)

    // Format response
    const formattedSchedules = schedules.map((schedule) => ({
      id: schedule.id,
      routeId: schedule.route_id,
      travelDate: schedule.travel_date,
      availableSeats: parseInt(schedule.available_seats) || 0,
      bookedSeats: parseInt(schedule.booked_seats) || 0,
      totalSeats: parseInt(schedule.total_seats) || 0,
      isCancelled: schedule.is_cancelled,
    }))

    return NextResponse.json({ schedules: formattedSchedules })
  } catch (error) {
    console.error("Schedules API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch schedules", schedules: [] },
      { status: 500 }
    )
  }
}


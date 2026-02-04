import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const scheduleId = searchParams.get("scheduleId")

    console.log(`[SEATS API] Request for route ${id}, scheduleId: ${scheduleId}`)

    if (!scheduleId) {
      return NextResponse.json(
        { error: "scheduleId is required" },
        { status: 400 }
      )
    }

    const scheduleIdNum = parseInt(scheduleId)
    if (isNaN(scheduleIdNum)) {
      return NextResponse.json(
        { error: "Invalid schedule ID" },
        { status: 400 }
      )
    }

    console.log(`[SEATS API] Fetching seat availability for scheduleId: ${scheduleIdNum}`)
    const seatAvailability = await db.getSeatAvailability(scheduleIdNum)
    console.log(`[SEATS API] Result - bookedSeats: ${JSON.stringify(seatAvailability.bookedSeats)}, availableCount: ${seatAvailability.availableCount}`)

    return NextResponse.json({
      scheduleId: scheduleIdNum,
      ...seatAvailability,
    })
  } catch (error) {
    console.error("Seats API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch seat availability" },
      { status: 500 }
    )
  }
}


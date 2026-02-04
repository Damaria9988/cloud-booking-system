import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"
import { broadcastRecurringScheduleCreated, broadcastSchedulesGenerated } from "@/lib/websocket-broadcast"
import { ScheduleGenerator } from "@/lib/services/schedule-generator"

// GET /api/admin/recurring-schedules - Get all recurring schedules
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const schedules = await db.getAllRecurringSchedules()
    return NextResponse.json({ schedules })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Get recurring schedules error:", error)
    return NextResponse.json({ error: "Failed to fetch recurring schedules" }, { status: 500 })
  }
}

// POST /api/admin/recurring-schedules - Create recurring schedule
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const {
      routeId,
      recurrenceType,
      recurrenceDays,
      startDate,
      endDate,
      departureTime,
      arrivalTime,
      priceOverride,
      seatCapacityOverride,
      status,
    } = body

    // Validate required fields
    if (!routeId || !recurrenceType || !startDate || !endDate || !departureTime || !arrivalTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate recurrence type
    if (recurrenceType === "weekly" && (!recurrenceDays || recurrenceDays.length === 0)) {
      return NextResponse.json(
        { error: "Recurrence days are required for weekly schedules" },
        { status: 400 }
      )
    }

    const result = await db.createRecurringSchedule({
      routeId,
      recurrenceType,
      recurrenceDays,
      startDate,
      endDate,
      departureTime,
      arrivalTime,
      priceOverride,
      seatCapacityOverride,
      status: status || "active",
    })

    const newRecurringSchedule = result[0]
    
    // Broadcast recurring schedule creation to connected clients
    try {
      broadcastRecurringScheduleCreated(newRecurringSchedule)
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError)
      // Don't fail the request if broadcast fails
    }

    // Automatically generate schedules from the recurring rule
    let generatedSchedules: any[] = []
    let generationError: string | null = null
    
    try {
      console.log(`[AUTO-GENERATE] Generating schedules for recurring schedule ${newRecurringSchedule.id}`)
      generatedSchedules = await ScheduleGenerator.generateFromRecurring(newRecurringSchedule)
      console.log(`[AUTO-GENERATE] Successfully generated ${generatedSchedules.length} schedules`)
      
      // Broadcast generated schedules to connected clients
      if (generatedSchedules.length > 0) {
        try {
          broadcastSchedulesGenerated(newRecurringSchedule.id, generatedSchedules.length, generatedSchedules)
        } catch (wsError) {
          console.error('WebSocket broadcast error for generated schedules:', wsError)
          // Don't fail the request if broadcast fails
        }
      }
    } catch (genError: any) {
      // Log error but don't fail the request - recurring schedule was created successfully
      generationError = genError.message || "Failed to generate schedules"
      console.error(`[AUTO-GENERATE] Error generating schedules for recurring schedule ${newRecurringSchedule.id}:`, genError)
    }

    // Return success with generation info
    return NextResponse.json({ 
      schedule: newRecurringSchedule,
      schedulesGenerated: generatedSchedules.length,
      message: generatedSchedules.length > 0
        ? `Recurring schedule created and ${generatedSchedules.length} schedules generated automatically with dynamic pricing.`
        : generationError
          ? `Recurring schedule created, but schedule generation failed: ${generationError}`
          : `Recurring schedule created. No schedules generated (date range may be invalid or no matching dates found).`
    }, { status: 201 })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Create recurring schedule error:", error)
    console.error("Error stack:", error.stack)
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code
    })
    return NextResponse.json({ 
      error: "Failed to create recurring schedule",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}


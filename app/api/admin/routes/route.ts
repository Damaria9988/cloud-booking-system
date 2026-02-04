import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"
import { broadcastRouteCreated } from "@/lib/websocket-broadcast"

// GET /api/admin/routes - Get all routes
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const routes = await db.getAllRoutes()
    return NextResponse.json({ routes })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Get routes error:", error)
    return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 })
  }
}

// POST /api/admin/routes - Create new route
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const {
      operatorId,
      fromCity,
      fromState,
      fromCountry,
      toCity,
      toState,
      toCountry,
      departureTime,
      arrivalTime,
      durationMinutes,
      vehicleType,
      transportType,
      totalSeats,
      basePrice,
      amenities,
      status,
    } = body

    // Validate required fields
    if (!operatorId || !fromCity || !fromState || !toCity || !toState || 
        !departureTime || !arrivalTime || !durationMinutes || !vehicleType || 
        !totalSeats || !basePrice) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate transportType
    if (transportType && !['bus', 'train', 'flight'].includes(transportType)) {
      return NextResponse.json(
        { error: "Transport type must be 'bus', 'train', or 'flight'" },
        { status: 400 }
      )
    }

    // Create route (includes duplicate check)
    const result = await db.createRoute({
      operatorId,
      fromCity,
      fromState,
      fromCountry,
      toCity,
      toState,
      toCountry,
      departureTime,
      arrivalTime,
      durationMinutes,
      vehicleType,
      transportType: transportType || 'bus',
      totalSeats,
      basePrice,
      amenities: amenities || [],
      status: status || 'active',
    })

    const newRoute = result[0]

    // Broadcast to connected clients (users will see new route immediately)
    broadcastRouteCreated(newRoute)

    return NextResponse.json({ 
      route: newRoute,
      message: "Route created successfully. Use recurring schedules to generate schedules with dynamic pricing."
    }, { status: 201 })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error.message?.includes("already exists") || error.message?.includes("Route already exists")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Create route error:", error)
    return NextResponse.json({ error: "Failed to create route" }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"
import { broadcastRouteUpdated } from "@/lib/websocket-broadcast"

// PATCH /api/admin/routes/[id] - Update route
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
      return NextResponse.json({ error: "Route ID is required" }, { status: 400 })
    }
    
    const routeId = parseInt(idParam)
    if (isNaN(routeId) || routeId <= 0) {
      console.error("Invalid route ID:", idParam)
      return NextResponse.json({ error: "Invalid route ID" }, { status: 400 })
    }

    const body = await request.json()

    // Get current route to check if we need to validate duplicates
    const currentRoute = await db.getRouteById(routeId)
    if (!currentRoute) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 })
    }

    // Check for duplicate route if key fields are being updated
    if (body.fromCity || body.fromState || body.fromCountry || body.toCity || body.toState || body.toCountry || body.operatorId || body.departureTime) {
      const fromCity = body.fromCity ?? currentRoute.from_city
      const fromState = body.fromState ?? currentRoute.from_state
      const fromCountry = body.fromCountry ?? currentRoute.from_country ?? undefined
      const toCity = body.toCity ?? currentRoute.to_city
      const toState = body.toState ?? currentRoute.to_state
      const toCountry = body.toCountry ?? currentRoute.to_country ?? undefined
      const operatorId = body.operatorId ?? currentRoute.operator_id
      const departureTime = body.departureTime ?? currentRoute.departure_time

      const routeExists = await db.checkRouteExists(
        fromCity.trim(),
        fromState.trim(),
        toCity.trim(),
        toState.trim(),
        operatorId,
        departureTime,
        routeId,
        fromCountry,
        toCountry
      )
      if (routeExists) {
        return NextResponse.json(
          { error: `Route already exists: ${fromCity}, ${fromState}${fromCountry ? `, ${fromCountry}` : ''} → ${toCity}, ${toState}${toCountry ? `, ${toCountry}` : ''} with the same operator and departure time` },
          { status: 400 }
        )
      }
    }

    const result = await db.updateRoute(routeId, body)

    if (result.length === 0) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 })
    }

    // Broadcast route update to connected clients
    broadcastRouteUpdated(result[0])

    return NextResponse.json({ route: result[0] })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error.message?.includes("already exists") || error.message?.includes("Route already exists")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error.message?.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error("Update route error:", error)
    return NextResponse.json({ error: "Failed to update route" }, { status: 500 })
  }
}

// DELETE /api/admin/routes/[id] - Delete route (soft delete)
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
      return NextResponse.json({ error: "Route ID is required" }, { status: 400 })
    }
    
    const routeId = parseInt(idParam)
    if (isNaN(routeId) || routeId <= 0) {
      console.error("Invalid route ID:", idParam)
      return NextResponse.json({ error: "Invalid route ID" }, { status: 400 })
    }

    const result = await db.deleteRoute(routeId)

    if (result.length === 0) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Route deleted successfully", route: result[0] })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error.message.includes("active bookings")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Delete route error:", error)
    return NextResponse.json({ error: "Failed to delete route" }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"
import { broadcastPriceOverrideSet, broadcastPriceOverrideRemoved } from "@/lib/websocket-broadcast"

// GET /api/admin/price-overrides - Get price overrides for a route
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const routeId = searchParams.get("routeId")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    if (!routeId) {
      return NextResponse.json(
        { error: "routeId is required" },
        { status: 400 }
      )
    }

    let sql = `SELECT * FROM date_price_overrides WHERE route_id = ?`
    const params: any[] = [routeId]

    if (dateFrom) {
      sql += ` AND travel_date >= date(?)`
      params.push(dateFrom)
    }
    if (dateTo) {
      sql += ` AND travel_date <= date(?)`
      params.push(dateTo)
    }

    sql += ` ORDER BY travel_date ASC`

    const overrides = await db.query(sql, params)
    return NextResponse.json({ overrides })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Get price overrides error:", error)
    return NextResponse.json({ error: "Failed to fetch price overrides" }, { status: 500 })
  }
}

// POST /api/admin/price-overrides - Set price override for a specific date
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { routeId, travelDate, price, reason } = body

    if (!routeId || !travelDate || price === undefined) {
      return NextResponse.json(
        { error: "routeId, travelDate, and price are required" },
        { status: 400 }
      )
    }

    if (price <= 0) {
      return NextResponse.json(
        { error: "Price must be greater than 0" },
        { status: 400 }
      )
    }

    await db.setDatePriceOverride(routeId, travelDate, price, reason || 'manual')

    // Broadcast to connected clients
    try {
      broadcastPriceOverrideSet(routeId, travelDate, price)
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError)
    }

    return NextResponse.json({ 
      message: "Price override set successfully",
      override: {
        routeId,
        travelDate,
        price,
        reason: reason || 'manual'
      }
    }, { status: 201 })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Set price override error:", error)
    return NextResponse.json({ error: "Failed to set price override" }, { status: 500 })
  }
}

// DELETE /api/admin/price-overrides - Remove price override
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const routeId = searchParams.get("routeId")
    const travelDate = searchParams.get("travelDate")

    if (!routeId || !travelDate) {
      return NextResponse.json(
        { error: "routeId and travelDate are required" },
        { status: 400 }
      )
    }

    await db.deleteDatePriceOverride(routeId, travelDate)

    // Broadcast to connected clients
    try {
      broadcastPriceOverrideRemoved(routeId, travelDate)
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError)
    }

    return NextResponse.json({ message: "Price override removed successfully" })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Delete price override error:", error)
    return NextResponse.json({ error: "Failed to remove price override" }, { status: 500 })
  }
}

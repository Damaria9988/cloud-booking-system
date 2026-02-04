import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { query } from "@/lib/db/connection"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const routeId = parseInt(id)
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get("date")

    if (isNaN(routeId)) {
      return NextResponse.json(
        { error: "Invalid route ID" },
        { status: 400 }
      )
    }

    const route = await db.getRouteById(routeId)

    if (!route) {
      return NextResponse.json(
        { error: "Route not found" },
        { status: 404 }
      )
    }
    
    // Get schedule for specific date if provided, otherwise get first upcoming
    let matchingSchedule = null
    
    if (dateParam) {
      try {
        // Find schedule for the specific date
        const dateSchedules = await query<any[]>(
          `SELECT id, travel_date, available_seats 
           FROM schedules 
           WHERE route_id = ? AND travel_date = ? AND is_cancelled = 0
           ORDER BY id ASC
           LIMIT 1`,
          [routeId, dateParam]
        )
        matchingSchedule = dateSchedules.length > 0 ? dateSchedules[0] : null
      } catch (scheduleErr) {
        console.error("Error fetching schedule for date:", scheduleErr)
        // Continue without date-specific schedule
      }
    }
    
    // Fallback to first upcoming schedule if no date match
    if (!matchingSchedule) {
      try {
        const schedules = await db.getSchedulesByRoute(routeId)
        matchingSchedule = schedules.length > 0 ? schedules[0] : null
      } catch (fallbackErr) {
        console.error("Error fetching fallback schedule:", fallbackErr)
        // Continue without schedule info
      }
    }

    // Validate base price
    const basePrice = parseFloat(route.base_price)
    if (isNaN(basePrice) || basePrice < 0) {
      console.error("Invalid base_price for route:", route.id, route.base_price)
      return NextResponse.json(
        { error: "Route has invalid pricing data" },
        { status: 500 }
      )
    }

    const durationMinutes = route.duration_minutes || 0

    // Format response
    const formattedRoute = {
      id: route.id,
      operator: route.operator_name || "Unknown Operator",
      operatorId: route.operator_id,
      rating: route.rating || 0,
      reviews: route.total_reviews || 0,
      fromCity: route.from_city || "",
      fromState: route.from_state || "",
      fromCountry: route.from_country || "",
      toCity: route.to_city || "",
      toState: route.to_state || "",
      toCountry: route.to_country || "",
      departureTime: route.departure_time || "",
      arrivalTime: route.arrival_time || "",
      duration: durationMinutes > 0 
        ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
        : "N/A",
      durationMinutes,
      vehicleType: route.vehicle_type || "",
      transportType: route.transport_type || 'bus',
      basePrice,
      amenities: route.amenities || [],
      totalSeats: route.total_seats || 0,
      operatorEmail: route.operator_email || null,
      operatorPhone: route.operator_phone || null,
      // Include schedule info for real-time seat updates
      scheduleId: matchingSchedule?.id || null,
      travelDate: matchingSchedule?.travel_date || dateParam || null,
    }

    // Add caching headers for better performance
    return NextResponse.json(
      { route: formattedRoute },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    console.error("Route API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch route" },
      { status: 500 }
    )
  }
}


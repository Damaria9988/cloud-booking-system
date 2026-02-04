import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { query } from "@/lib/db/connection"

// Get first upcoming schedule for a route (fallback when getRoutes doesn't return it)
async function getFirstScheduleForRoute(routeId: number): Promise<{ schedule_id: number; travel_date: string } | null> {
  const result = await query<{ id: number; travel_date: string }>(
    `SELECT id, travel_date FROM schedules 
     WHERE route_id = ? AND is_cancelled = 0 AND travel_date >= date('now') 
     ORDER BY travel_date ASC LIMIT 1`,
    [routeId]
  )
  if (result.length > 0) {
    return { schedule_id: result[0].id, travel_date: result[0].travel_date }
  }
  // Fallback to any schedule
  const fallback = await query<{ id: number; travel_date: string }>(
    `SELECT id, travel_date FROM schedules 
     WHERE route_id = ? AND is_cancelled = 0 
     ORDER BY travel_date DESC LIMIT 1`,
    [routeId]
  )
  return fallback.length > 0 ? { schedule_id: fallback[0].id, travel_date: fallback[0].travel_date } : null
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fromCity = searchParams.get("from")
    const toCity = searchParams.get("to")
    const fromState = searchParams.get("fromState")
    const toState = searchParams.get("toState")
    const fromCountry = searchParams.get("fromCountry")
    const toCountry = searchParams.get("toCountry")
    const date = searchParams.get("date")
    const vehicleType = searchParams.get("vehicleType")
    const transportType = searchParams.get("transportType")

    // Build filters
    const filters: {
      fromCity?: string
      toCity?: string
      fromState?: string
      toState?: string
      fromCountry?: string
      toCountry?: string
      date?: string
      vehicleType?: string
      transportType?: string
    } = {}

    if (fromCity) {
      // Trim and normalize the city name
      const normalizedFromCity = fromCity.trim()
      filters.fromCity = normalizedFromCity
    }
    if (toCity) {
      // Trim and normalize the city name
      const normalizedToCity = toCity.trim()
      filters.toCity = normalizedToCity
    }
    if (fromState) {
      filters.fromState = fromState.trim()
    }
    if (toState) {
      filters.toState = toState.trim()
    }
    if (fromCountry) {
      filters.fromCountry = fromCountry.trim()
    }
    if (toCountry) {
      filters.toCountry = toCountry.trim()
    }
    if (date) {
      filters.date = date
    }
    if (transportType) {
      filters.transportType = transportType
    }
    if (vehicleType) {
      filters.vehicleType = vehicleType
    }

    // Get routes from database
    const routes = await db.getRoutes(filters)

    // Format response with validation
    const formattedRoutes = await Promise.all(routes
      .map(async (route) => {
        // Validate base price
        const basePrice = parseFloat(route.base_price)
        if (isNaN(basePrice) || basePrice < 0) {
          console.error("Invalid base_price for route:", route.id, route.base_price)
          return null // Filter out invalid routes
        }

        const rawAmenities = route.amenities
        let amenities: string[] = []
        if (Array.isArray(rawAmenities)) {
          amenities = rawAmenities
        } else if (typeof rawAmenities === "string" && rawAmenities.trim().startsWith("[")) {
          try {
            const parsed = JSON.parse(rawAmenities)
            amenities = Array.isArray(parsed) ? parsed : []
          } catch {
            amenities = []
          }
        } else if (rawAmenities) {
          amenities = String(rawAmenities)
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        }

        const totalSeats = route.total_seats ?? 0
        // Handle NULL booked_seats_count (when subquery returns NULL for no schedule or no bookings)
        const bookedSeatsCount = route.booked_seats_count != null ? Number(route.booked_seats_count) : 0
        // Calculate available seats: total_seats - booked_seats_count
        const availableSeats = Math.max(0, totalSeats - bookedSeatsCount)
        const durationMinutes = route.duration_minutes || 0

        // Fallback: fetch schedule if not provided by getRoutes (caching workaround)
        let travelDate = route.travel_date || ""
        let scheduleId = route.schedule_id || null
        if (!travelDate || !scheduleId) {
          const scheduleInfo = await getFirstScheduleForRoute(route.id)
          if (scheduleInfo) {
            travelDate = scheduleInfo.travel_date
            scheduleId = scheduleInfo.schedule_id
          }
        }

        return {
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
          amenities,
          availableSeats: Number(availableSeats) || 0,
          totalSeats: Number(totalSeats) || 0,
          travelDate,
          scheduleId,
        }
      }))
    
    // Filter out null routes
    const filteredRoutes = formattedRoutes.filter((route): route is NonNullable<typeof route> => route !== null)

    return NextResponse.json({ routes: filteredRoutes })
  } catch (error) {
    console.error("Routes API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch routes", routes: [] },
      { status: 500 }
    )
  }
}


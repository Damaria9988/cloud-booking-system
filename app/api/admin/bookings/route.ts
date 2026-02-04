import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { autoCompletePastBookingsIfNeeded } from "@/lib/db/bookings"
import { requireAdmin } from "@/lib/get-user"

// GET /api/admin/bookings - Get all bookings with filters
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const routeId = searchParams.get("routeId")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const status = searchParams.get("status")
    const paymentStatus = searchParams.get("paymentStatus")
    const vehicleType = searchParams.get("vehicleType")

    const filters: any = {}
    if (routeId) filters.routeId = parseInt(routeId)
    if (dateFrom) filters.dateFrom = dateFrom
    if (dateTo) filters.dateTo = dateTo
    if (status) filters.status = status
    if (paymentStatus) filters.paymentStatus = paymentStatus
    if (vehicleType) filters.vehicleType = vehicleType

    // Auto-complete past bookings (runs at most once per hour per server process)
    await autoCompletePastBookingsIfNeeded()

    const bookings = await db.getAllBookings(filters)

    // Apply limit if specified
    const limit = searchParams.get("limit")
    const limitedBookings = limit ? bookings.slice(0, parseInt(limit)) : bookings

    // Format bookings
    const formattedBookings = limitedBookings.map((booking: any) => {
      // Ensure travel_date is properly formatted
      let travelDate = booking.travel_date
      if (travelDate) {
        if (typeof travelDate === 'string') {
          // Trim whitespace
          travelDate = travelDate.trim()
          
          // If it's already in YYYY-MM-DD format, keep it as is
          if (/^\d{4}-\d{2}-\d{2}/.test(travelDate)) {
            // Valid format, keep it
          } else {
            // Try to parse and reformat
            try {
              const parsedDate = new Date(travelDate)
              if (!isNaN(parsedDate.getTime())) {
                // Format as YYYY-MM-DD
                const year = parsedDate.getFullYear()
                const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
                const day = String(parsedDate.getDate()).padStart(2, '0')
                travelDate = `${year}-${month}-${day}`
              } else {
                // Invalid date, set to null
                travelDate = null
              }
            } catch {
              travelDate = null
            }
          }
        } else if (travelDate instanceof Date) {
          // If it's a Date object, format it
          if (!isNaN(travelDate.getTime())) {
            const year = travelDate.getFullYear()
            const month = String(travelDate.getMonth() + 1).padStart(2, '0')
            const day = String(travelDate.getDate()).padStart(2, '0')
            travelDate = `${year}-${month}-${day}`
          } else {
            travelDate = null
          }
        } else {
          travelDate = null
        }
      } else {
        travelDate = null
      }
      
      return {
        id: booking.id,
        bookingId: booking.booking_id,
        pnr: booking.pnr,
        status: booking.booking_status,
        paymentStatus: booking.payment_status,
        from: `${booking.from_city || ''}, ${booking.from_state || ''}`,
        to: `${booking.to_city || ''}, ${booking.to_state || ''}`,
        operator: booking.operator_name || 'Unknown',
        vehicleType: booking.vehicle_type,
        transportType: booking.transport_type || 'bus', // Default to 'bus' if not set
        date: travelDate,
        travelDate: travelDate, // Also include as travelDate for compatibility
        departureTime: booking.departure_time,
        arrivalTime: booking.arrival_time,
        seats: booking.seats || [],
        passengers: booking.passenger_names || [],
        userName: booking.user_name,
        userEmail: booking.user_email,
        totalAmount: parseFloat(booking.total_amount),
        discountAmount: parseFloat(booking.discount_amount || 0),
        taxAmount: parseFloat(booking.tax_amount),
        finalAmount: parseFloat(booking.final_amount),
        promoCode: booking.promo_code,
        createdAt: booking.created_at,
        tripType: booking.trip_type || 'one-way',
        roundTripId: booking.round_trip_id || null,
        isReturn: booking.is_return === 1 || booking.is_return === true,
      }
    })

    return NextResponse.json({ bookings: formattedBookings })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Get bookings error:", error)
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/get-user"
import { broadcastSeatUpdate, broadcastBookingCreated } from "@/lib/websocket-broadcast"
import { isBusinessClassSeat, getSeatPrice, calculateSeatsTotal } from "@/lib/pricing"

// GET /api/bookings - Get user bookings
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const bookings = await db.getBookingsByUser(user.id)

    // Format bookings
    const formattedBookings = bookings.map((booking: any) => ({
      id: booking.id,
      bookingId: booking.booking_id,
      pnr: booking.pnr,
      status: booking.booking_status,
      paymentStatus: booking.payment_status,
      from: booking.from_city,
      to: booking.to_city,
      operator: booking.operator_name,
      date: booking.travel_date,
      departureTime: booking.departure_time,
      arrivalTime: booking.arrival_time,
      seats: booking.seats || [],
      totalAmount: parseFloat(booking.total_amount),
      discountAmount: parseFloat(booking.discount_amount || 0),
      taxAmount: parseFloat(booking.tax_amount),
      finalAmount: parseFloat(booking.final_amount),
      promoCode: booking.promo_code,
      createdAt: booking.created_at,
    }))

    return NextResponse.json({ bookings: formattedBookings })
  } catch (error) {
    console.error("Get bookings error:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    )
  }
}

// POST /api/bookings - Create new booking
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      routeId,
      scheduleId,
      travelDate,
      seats,
      passengers,
      contactEmail,
      contactPhone,
      // promoCode, // Promo code commented out
      paymentMethod,
      insuranceCost = 0,
      tripType = 'one-way',
      roundTripId,
      isReturn = false,
    } = body

    // Validate required fields
    if (!routeId || !scheduleId || !travelDate || !seats || !passengers || !contactEmail || !contactPhone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate arrays are not empty
    if (!Array.isArray(seats) || seats.length === 0) {
      return NextResponse.json(
        { error: "At least one seat must be selected" },
        { status: 400 }
      )
    }

    if (!Array.isArray(passengers) || passengers.length === 0) {
      return NextResponse.json(
        { error: "At least one passenger is required" },
        { status: 400 }
      )
    }

    if (seats.length !== passengers.length) {
      return NextResponse.json(
        { error: "Number of seats must match number of passengers" },
        { status: 400 }
      )
    }

    // Validate schedule ID
    const scheduleIdNum = typeof scheduleId === 'string' ? parseInt(scheduleId, 10) : Number(scheduleId)
    if (isNaN(scheduleIdNum) || scheduleIdNum <= 0) {
      return NextResponse.json(
        { error: "Invalid schedule ID" },
        { status: 400 }
      )
    }

    // Validate travel date is not in the past
    const today = new Date().toISOString().split('T')[0]
    if (travelDate < today) {
      return NextResponse.json(
        { error: "Cannot book for a past date. Please select a future travel date." },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json(
        { error: "Invalid email address format" },
        { status: 400 }
      )
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    const phoneDigits = contactPhone.replace(/\D/g, '')
    if (!phoneRegex.test(contactPhone) || phoneDigits.length < 10) {
      return NextResponse.json(
        { error: "Invalid phone number. Please provide a valid phone number with at least 10 digits." },
        { status: 400 }
      )
    }

    // Validate seat availability (advisory check - actual check happens in transaction)
    // Note: This is a pre-check for better UX. The actual atomic check happens in db.createBooking
    try {
      const seatAvailability = await db.getSeatAvailability(scheduleIdNum)
      const bookedSeatsArray = Array.isArray(seatAvailability.bookedSeats) ? seatAvailability.bookedSeats : []
      const unavailableSeats = seats.filter((seat: string) => 
        bookedSeatsArray.includes(seat)
      )

      if (unavailableSeats.length > 0) {
        return NextResponse.json(
          { error: `Seats ${unavailableSeats.join(", ")} are no longer available` },
          { status: 409 }
        )
      }
    } catch (seatCheckError) {
      console.error("Error checking seat availability:", seatCheckError)
      // Don't fail here - let the transaction handle it
    }

    // Get route details for pricing
    const route = await db.getRouteById(routeId)
    if (!route) {
      return NextResponse.json(
        { error: "Route not found" },
        { status: 404 }
      )
    }

    // Validate and calculate prices
    const basePrice = parseFloat(route.base_price)
    if (isNaN(basePrice) || basePrice <= 0) {
      console.error("Invalid route pricing:", { routeId, basePrice: route.base_price })
      return NextResponse.json(
        { error: "Invalid route pricing. Please contact support." },
        { status: 500 }
      )
    }
    
    // Check if this is a flight - apply business class premium for rows 1-4
    const isFlightMode = route.transport_type === "flight"
    
    // Calculate subtotal with business class premium for flights
    let subtotal = 0
    if (isFlightMode) {
      // For flights, calculate each seat's price based on class
      subtotal = seats.reduce((total: number, seat: string) => {
        const seatPrice = getSeatPrice(seat, basePrice)
        return total + seatPrice
      }, 0)
      console.log("[BOOKING] Flight booking - calculated with business class:", {
        seats,
        basePrice,
        businessSeats: seats.filter(isBusinessClassSeat),
        economySeats: seats.filter((s: string) => !isBusinessClassSeat(s)),
        subtotal
      })
    } else {
      // For bus/train, use flat rate
      subtotal = basePrice * seats.length
    }
    
    if (isNaN(subtotal) || subtotal <= 0) {
      console.error("Invalid subtotal calculation:", { basePrice, seatsCount: seats.length })
      return NextResponse.json(
        { error: "Invalid booking calculation. Please try again." },
        { status: 500 }
      )
    }
    
    // Tax calculation commented out
    // const taxRate = 0.08 // 8% tax
    // const taxAmount = subtotal * taxRate
    const taxAmount = 0 // Taxes disabled

    // Calculate discounts
    let discountAmount = 0
    let studentDiscountAmount = 0
    // let winterDiscountAmount = 0 // Winter discount commented out
    // let promoDiscountAmount = 0 // Promo code commented out

    // Winter discount commented out - no longer applies
    // // Check if it's winter season (December, January, February)
    // const travelDateObj = new Date(travelDate)
    // const month = travelDateObj.getMonth() + 1 // getMonth() returns 0-11
    // const isWinter = month === 12 || month === 1 || month === 2

    // // Apply winter discount (15% automatic during winter months)
    // if (isWinter) {
    //   winterDiscountAmount = subtotal * 0.15
    //   discountAmount += winterDiscountAmount
    // }

    // Apply student discount (30% automatic)
    if (user.isStudent) {
      studentDiscountAmount = subtotal * 0.3
      discountAmount += studentDiscountAmount
    }

    // Promo code discount - Commented out
    // if (promoCode) {
    //   const promoResult = await db.validatePromoCode(
    //     promoCode,
    //     user.isStudent ? "student" : "all"
    //   )
    //   if (promoResult.length > 0) {
    //     const promo = promoResult[0]
    //     if (promo.discount_type === "percentage") {
    //       promoDiscountAmount = (subtotal * parseFloat(promo.discount_value)) / 100
    //     } else {
    //       promoDiscountAmount = parseFloat(promo.discount_value)
    //     }
    //     
    //     // Apply max discount cap if set
    //     if (promo.max_discount) {
    //       promoDiscountAmount = Math.min(promoDiscountAmount, parseFloat(promo.max_discount))
    //     }
    //     
    //     discountAmount += promoDiscountAmount
    //   }
    // }

    // Insurance is disabled, so insuranceCost should always be 0
    // Tax calculation commented out
    const finalAmount = subtotal - discountAmount // Total without tax

    // Generate round trip ID if this is the first booking in a round trip
    const finalRoundTripId = tripType === 'round-trip' 
      ? (roundTripId || `RT-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`)
      : undefined

    // Create booking
    console.log("[BOOKING] Creating booking with seats:", seats, "for scheduleId:", scheduleIdNum)
    const booking = await db.createBooking({
      userId: user.id,
      routeId,
      scheduleId: scheduleIdNum,
      travelDate,
      totalAmount: subtotal,
      discountAmount, // Includes winter and student discounts (promo code commented out)
      taxAmount,
      finalAmount,
      // promoCode: promoCode || undefined, // Promo code commented out
      paymentMethod: paymentMethod || undefined,
      contactEmail,
      contactPhone,
      passengers: passengers.map((p: any, index: number) => {
        // Validate passenger data
        const age = parseInt(p.age)
        if (isNaN(age) || age < 0 || age > 150) {
          throw new Error(`Invalid age for passenger ${index + 1}. Age must be between 0 and 150.`)
        }

        if (!p.firstName || !p.firstName.trim()) {
          throw new Error(`First name is required for passenger ${index + 1}`)
        }

        if (!p.lastName || !p.lastName.trim()) {
          throw new Error(`Last name is required for passenger ${index + 1}`)
        }

        const validGenders = ['male', 'female', 'other']
        const gender = p.gender ? p.gender.toLowerCase() : ''
        if (!gender || !validGenders.includes(gender)) {
          throw new Error(`Invalid gender for passenger ${index + 1}. Must be one of: ${validGenders.join(', ')}`)
        }

        if (!seats[index]) {
          throw new Error(`Seat number missing for passenger ${index + 1}`)
        }

        return {
          seatNumber: seats[index],
          firstName: p.firstName.trim(),
          lastName: p.lastName.trim(),
          age,
          gender,
          passengerType: p.passengerType || 'adult',
        }
      }),
      tripType: tripType === 'round-trip' ? 'round-trip' : 'one-way',
      roundTripId: finalRoundTripId,
      isReturn: tripType === 'round-trip' ? isReturn : false,
    })

    // Broadcast real-time updates
    try {
      // Get updated seat availability
      console.log("[BOOKING] Fetching updated seat availability for scheduleId:", scheduleIdNum)
      const updatedSeats = await db.getSeatAvailability(scheduleIdNum)
      console.log("[BOOKING] Updated seats response:", updatedSeats)
      
      const updatedBookedSeats = Array.isArray(updatedSeats.bookedSeats) ? updatedSeats.bookedSeats : []
      const availableSeatsCount = Array.isArray(updatedSeats.availableSeats)
        ? updatedSeats.availableSeats.length
        : typeof updatedSeats.availableSeats === 'number'
          ? updatedSeats.availableSeats
          : 0
      
      console.log("[BOOKING] Broadcasting seat update - scheduleId:", scheduleIdNum, "bookedSeats:", updatedBookedSeats, "availableCount:", availableSeatsCount)
      broadcastSeatUpdate(scheduleIdNum, availableSeatsCount, updatedBookedSeats)
      console.log("[BOOKING] Seat update broadcast sent successfully")
      
      // Broadcast new booking to admin
      broadcastBookingCreated(booking.id, scheduleIdNum, {
        id: booking.id,
        pnr: booking.pnr,
        userName: `${user.firstName} ${user.lastName}`,
        seats: seats.length,
        amount: finalAmount,
        createdAt: new Date().toISOString(),
      })
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError)
      // Don't fail the booking if WebSocket fails
    }

    return NextResponse.json(
      {
        booking: {
          id: booking.id,
          bookingId: booking.booking_id,
          pnr: booking.pnr,
          status: booking.booking_status,
          finalAmount: parseFloat(booking.final_amount),
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Create booking error:", error)
    console.error("Error stack:", error?.stack)
    console.error("Error message:", error?.message)
    return NextResponse.json(
      { 
        error: "Failed to create booking",
        details: error?.message || String(error),
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}


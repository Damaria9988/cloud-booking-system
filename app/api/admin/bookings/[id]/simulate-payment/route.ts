import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"

// PATCH /api/admin/bookings/[id]/simulate-payment - Simulate payment (for testing)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const bookingId = parseInt(params.id)
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 })
    }

    const body = await request.json()
    const { paymentMethod = "card" } = body

    // Update booking payment status
    const result = await db.query(
      `UPDATE bookings 
       SET payment_status = 'paid', 
           payment_method = $1,
           booking_status = CASE WHEN booking_status = 'pending' THEN 'confirmed' ELSE booking_status END,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [paymentMethod, bookingId]
    )

    if (result.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Payment simulated successfully",
      booking: result[0],
    })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Simulate payment error:", error)
    return NextResponse.json({ error: "Failed to simulate payment" }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"

// PATCH /api/admin/bookings/[id]/status - Override booking status
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
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }
    
    const bookingId = parseInt(idParam)
    if (isNaN(bookingId) || bookingId <= 0) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 })
    }

    const body = await request.json()
    const { status, paymentStatus } = body

    if (!status && !paymentStatus) {
      return NextResponse.json(
        { error: "Status or payment status is required" },
        { status: 400 }
      )
    }

    // Validate status values
    const validStatuses = ["pending", "confirmed", "cancelled", "completed"]
    const validPaymentStatuses = ["pending", "paid", "refunded", "failed"]

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      )
    }

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(", ")}` },
        { status: 400 }
      )
    }

    // Update statuses
    const updates: string[] = []
    const updateParams: any[] = []

    if (status) {
      updates.push(`booking_status = ?`)
      updateParams.push(status)
    }

    if (paymentStatus) {
      updates.push(`payment_status = ?`)
      updateParams.push(paymentStatus)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    updates.push(`updated_at = datetime('now')`)
    updateParams.push(bookingId)

    await db.execute(
      `UPDATE bookings SET ${updates.join(", ")} WHERE id = ?`,
      updateParams
    )

    const result = await db.getBookingById(bookingId)

    if (!result) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Booking status updated successfully",
      booking: result,
    })
  } catch (error: any) {
    // Always return JSON, never HTML - handle all error cases
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error.message === "Forbidden" || error.message.includes("Forbidden") || error.message.includes("Admin access required")) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }
    console.error("Update booking status error:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to update booking status" 
    }, { status: 500 })
  }
}


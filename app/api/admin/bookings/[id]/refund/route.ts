import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"

// PATCH /api/admin/bookings/[id]/refund - Process refund
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

    // Get booking
    const booking = await db.getBookingById(bookingId)
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Process refund
    const result = await db.processRefund(bookingId)

    if (result.length === 0) {
      return NextResponse.json({ error: "Failed to process refund" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Refund processed successfully",
      booking: result[0],
    })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Process refund error:", error)
    return NextResponse.json({ error: "Failed to process refund" }, { status: 500 })
  }
}


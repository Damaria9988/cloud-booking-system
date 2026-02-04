import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"
import { RevenueCalculator } from "@/lib/services/revenue-calculator"

// GET /api/admin/stats - Get overall statistics
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    // Get overall revenue stats
    const revenueStats = await RevenueCalculator.getTotalRevenue(dateFrom || undefined, dateTo || undefined)

    // Get occupancy rate
    const occupancy = await RevenueCalculator.getOccupancyRate(dateFrom || undefined, dateTo || undefined)

    // Get promo usage
    const promoUsage = await RevenueCalculator.getPromoUsage(dateFrom || undefined, dateTo || undefined)

    // Get cancellation rate (SQLite compatible)
    let cancellationSql = `SELECT 
        SUM(CASE WHEN booking_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
        COUNT(*) as total_bookings
       FROM bookings`
    const cancellationParams: any[] = []
    
    if (dateFrom || dateTo) {
      cancellationSql += ` WHERE 1=1`
      if (dateFrom) {
        cancellationSql += ` AND created_at >= date(?)`
        cancellationParams.push(dateFrom)
      }
      if (dateTo) {
        cancellationSql += ` AND created_at <= date(?)`
        cancellationParams.push(dateTo)
      }
    }
    
    const cancellationStats = await db.query(cancellationSql, cancellationParams)

    const cancellationRow = cancellationStats[0] || { cancelled_bookings: 0, total_bookings: 0 }
    const cancellationRate = cancellationRow.total_bookings > 0
      ? (cancellationRow.cancelled_bookings / cancellationRow.total_bookings) * 100
      : 0

    return NextResponse.json({
      stats: {
        totalRevenue: parseFloat(revenueStats.total_revenue || 0),
        totalBookings: parseInt(revenueStats.total_bookings || 0),
        averageTicketPrice: parseFloat(revenueStats.average_ticket_price || 0),
        occupancyRate: occupancy.occupancyRate,
        promoUsagePercent: promoUsage.promoUsagePercent,
        cancellationRate: parseFloat(cancellationRate.toFixed(2)),
      },
      occupancy,
      promoUsage,
    })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Get stats error:", error)
    console.error("Error stack:", error.stack)
    return NextResponse.json({ 
      error: "Failed to fetch statistics",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"

// GET /api/admin/reports - Get reports data
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get("dateRange") || "last7"
    const reportType = searchParams.get("reportType") || "daily"

    // Calculate date range
    const today = new Date()
    let dateFrom: string
    let dateTo: string = today.toISOString().split('T')[0]

    switch (dateRange) {
      case "today":
        dateFrom = dateTo
        break
      case "last7":
        const last7 = new Date(today)
        last7.setDate(last7.getDate() - 7)
        dateFrom = last7.toISOString().split('T')[0]
        break
      case "last30":
        const last30 = new Date(today)
        last30.setDate(last30.getDate() - 30)
        dateFrom = last30.toISOString().split('T')[0]
        break
      case "all":
        // For "all time", set dateFrom to a very early date
        dateFrom = "2000-01-01"
        break
      default:
        const last7Default = new Date(today)
        last7Default.setDate(last7Default.getDate() - 7)
        dateFrom = last7Default.toISOString().split('T')[0]
    }

    // Get daily performance data - match dashboard logic (paid/completed bookings)
    const dailyPerformance = await db.query<any>(`
      SELECT 
        date(created_at) as date,
        COUNT(*) as bookings,
        COALESCE(SUM(final_amount), 0) as revenue,
        COALESCE(AVG(final_amount), 0) as avg_price
      FROM bookings
      WHERE payment_status IN ('paid', 'completed')
        AND date(created_at) >= date(?)
        AND date(created_at) <= date(?)
      GROUP BY date(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, [dateFrom, dateTo])

    // Get top performing routes - match dashboard logic (paid/completed bookings)
    const topRoutes = await db.query<any>(`
      SELECT 
        r.from_city || ' → ' || r.to_city as route,
        COUNT(b.id) as bookings,
        COALESCE(SUM(b.final_amount), 0) as revenue
      FROM bookings b
      JOIN routes r ON b.route_id = r.id
      WHERE b.payment_status IN ('paid', 'completed')
        AND date(b.created_at) >= date(?)
        AND date(b.created_at) <= date(?)
      GROUP BY r.id, r.from_city, r.to_city
      ORDER BY bookings DESC
      LIMIT 10
    `, [dateFrom, dateTo])

    // Get summary stats - match dashboard logic (paid/completed bookings)
    // If dateRange is "all", don't filter by date to match dashboard behavior
    let statsQuery = `
      SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(final_amount), 0) as total_revenue,
        COALESCE(AVG(final_amount), 0) as avg_ticket_price
      FROM bookings
      WHERE payment_status IN ('paid', 'completed')
    `
    const statsParams: any[] = []
    
    if (dateRange !== "all") {
      statsQuery += ` AND date(created_at) >= date(?) AND date(created_at) <= date(?)`
      statsParams.push(dateFrom, dateTo)
    }
    
    const stats = await db.query<any>(statsQuery, statsParams)
    
    // Get new users count - users created in the date range (not users who made bookings)
    const newUsersResult = await db.query<any>(`
      SELECT COUNT(*) as new_users
      FROM users
      WHERE (is_admin = 0 OR is_admin IS NULL)
        AND date(created_at) >= date(?)
        AND date(created_at) <= date(?)
    `, [dateFrom, dateTo])
    
    const newUsers = newUsersResult[0]?.new_users || 0

    // Get previous period stats for comparison
    const daysDiff = Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24))
    const prevDateFrom = new Date(dateFrom)
    prevDateFrom.setDate(prevDateFrom.getDate() - daysDiff - 1)
    const prevDateTo = new Date(dateFrom)
    prevDateTo.setDate(prevDateTo.getDate() - 1)

    const prevStats = await db.query<any>(`
      SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(final_amount), 0) as total_revenue,
        COALESCE(AVG(final_amount), 0) as avg_ticket_price
      FROM bookings
      WHERE payment_status IN ('paid', 'completed')
        AND date(created_at) >= date(?)
        AND date(created_at) <= date(?)
    `, [prevDateFrom.toISOString().split('T')[0], prevDateTo.toISOString().split('T')[0]])

    const currentStats = stats[0] || {
      total_bookings: 0,
      total_revenue: 0,
      avg_ticket_price: 0
    }

    const previousStats = prevStats[0] || {
      total_bookings: 0,
      total_revenue: 0,
      avg_ticket_price: 0
    }

    // Calculate percentage changes
    const bookingsChange = previousStats.total_bookings > 0
      ? ((currentStats.total_bookings - previousStats.total_bookings) / previousStats.total_bookings) * 100
      : 0

    const revenueChange = previousStats.total_revenue > 0
      ? ((currentStats.total_revenue - previousStats.total_revenue) / previousStats.total_revenue) * 100
      : 0

    const avgPriceChange = previousStats.avg_ticket_price > 0
      ? ((currentStats.avg_ticket_price - previousStats.avg_ticket_price) / previousStats.avg_ticket_price) * 100
      : 0

    // Format daily performance
    const formattedDaily = dailyPerformance.map((day: any) => {
      let formattedDate = day.date
      try {
        // SQLite returns date as YYYY-MM-DD string, convert to Date object
        const dateObj = new Date(day.date + 'T00:00:00')
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }
      } catch (e) {
        // If date parsing fails, use the original string
        formattedDate = day.date
      }
      return {
        date: formattedDate,
        bookings: day.bookings || 0,
        revenue: parseFloat(day.revenue || 0),
        avgPrice: Math.round(parseFloat(day.avg_price || 0))
      }
    })

    // Format top routes
    const formattedRoutes = topRoutes.map((route: any) => ({
      route: route.route,
      bookings: route.bookings || 0,
      revenue: parseFloat(route.revenue || 0)
    }))

    return NextResponse.json({
      stats: {
        totalBookings: currentStats.total_bookings || 0,
        totalRevenue: parseFloat(currentStats.total_revenue || 0),
        avgTicketPrice: Math.round(parseFloat(currentStats.avg_ticket_price || 0)),
        newUsers: newUsers,
        bookingsChange: Math.round(bookingsChange),
        revenueChange: Math.round(revenueChange),
        avgPriceChange: Math.round(avgPriceChange)
      },
      dailyPerformance: formattedDaily,
      topRoutes: formattedRoutes
    })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Get reports error:", error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}

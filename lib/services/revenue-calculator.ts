import { query } from "@/lib/db"

export class RevenueCalculator {
  /**
   * Calculate total revenue
   */
  static async getTotalRevenue(dateFrom?: string, dateTo?: string) {
    let sql = `
      SELECT 
        COALESCE(SUM(final_amount), 0) as total_revenue,
        COUNT(*) as total_bookings,
        COALESCE(AVG(final_amount), 0) as average_ticket_price
      FROM bookings
      WHERE payment_status IN ('paid', 'completed')
    `
    const params: any[] = []

    if (dateFrom) {
      params.push(dateFrom)
      sql += ` AND created_at >= date(?)`
    }
    if (dateTo) {
      params.push(dateTo)
      sql += ` AND created_at <= date(?)`
    }

    const result = await query(sql, params)
    return result[0] || { total_revenue: 0, total_bookings: 0, average_ticket_price: 0 }
  }

  /**
   * Calculate revenue by mode (vehicle type)
   */
  static async getRevenueByMode(dateFrom?: string, dateTo?: string) {
    let sql = `
      SELECT 
        r.vehicle_type,
        COUNT(b.id) as booking_count,
        COALESCE(SUM(b.final_amount), 0) as revenue
      FROM bookings b
      JOIN routes r ON b.route_id = r.id
      WHERE b.payment_status IN ('paid', 'completed')
    `
    const params: any[] = []

    if (dateFrom) {
      params.push(dateFrom)
      sql += ` AND b.created_at >= date(?)`
    }
    if (dateTo) {
      params.push(dateTo)
      sql += ` AND b.created_at <= date(?)`
    }

    sql += ` GROUP BY r.vehicle_type ORDER BY revenue DESC`

    return query(sql, params)
  }

  /**
   * Calculate revenue by route
   */
  static async getRevenueByRoute(dateFrom?: string, dateTo?: string, limit = 10) {
    let sql = `
      SELECT 
        r.id,
        r.from_city || ', ' || r.from_state as from_location,
        r.to_city || ', ' || r.to_state as to_location,
        COUNT(b.id) as booking_count,
        COALESCE(SUM(b.final_amount), 0) as revenue
      FROM bookings b
      JOIN routes r ON b.route_id = r.id
      WHERE b.payment_status IN ('paid', 'completed')
    `
    const params: any[] = []

    if (dateFrom) {
      params.push(dateFrom)
      sql += ` AND b.created_at >= date(?)`
    }
    if (dateTo) {
      params.push(dateTo)
      sql += ` AND b.created_at <= date(?)`
    }

    params.push(limit)
    sql += ` GROUP BY r.id, r.from_city, r.from_state, r.to_city, r.to_state ORDER BY revenue DESC LIMIT ?`

    return query(sql, params)
  }

  /**
   * Calculate occupancy rate
   */
  static async getOccupancyRate(dateFrom?: string, dateTo?: string) {
    let sql = `
      SELECT 
        COALESCE(SUM(r.total_seats), 0) as total_seats,
        COALESCE(SUM(sb.booked_count), 0) as booked_seats
      FROM schedules s
      JOIN routes r ON s.route_id = r.id
      LEFT JOIN (
        SELECT schedule_id, COUNT(*) as booked_count
        FROM seat_bookings
        WHERE status = 'booked'
        GROUP BY schedule_id
      ) sb ON s.id = sb.schedule_id
      WHERE s.is_cancelled = 0
    `
    const params: any[] = []

    if (dateFrom) {
      params.push(dateFrom)
      sql += ` AND s.travel_date >= date(?)`
    }
    if (dateTo) {
      params.push(dateTo)
      sql += ` AND s.travel_date <= date(?)`
    }

    const result = await query(sql, params)
    const row = result[0] || { total_seats: 0, booked_seats: 0 }
    const occupancyRate = row.total_seats > 0 
      ? (row.booked_seats / row.total_seats) * 100 
      : 0

    return {
      totalSeats: parseInt(row.total_seats),
      bookedSeats: parseInt(row.booked_seats),
      occupancyRate: parseFloat(occupancyRate.toFixed(2)),
    }
  }

  /**
   * Calculate promo usage statistics
   */
  static async getPromoUsage(dateFrom?: string, dateTo?: string) {
    let sql = `
      SELECT 
        SUM(CASE WHEN promo_code IS NOT NULL THEN 1 ELSE 0 END) as bookings_with_promo,
        COUNT(*) as total_bookings,
        COUNT(DISTINCT promo_code) as unique_promos_used
      FROM bookings
      WHERE payment_status IN ('paid', 'completed')
    `
    const params: any[] = []

    if (dateFrom) {
      params.push(dateFrom)
      sql += ` AND created_at >= date(?)`
    }
    if (dateTo) {
      params.push(dateTo)
      sql += ` AND created_at <= date(?)`
    }

    const result = await query(sql, params)
    const row = result[0] || { bookings_with_promo: 0, total_bookings: 0, unique_promos_used: 0 }
    const promoUsagePercent = row.total_bookings > 0
      ? (row.bookings_with_promo / row.total_bookings) * 100
      : 0

    return {
      bookingsWithPromo: parseInt(row.bookings_with_promo),
      totalBookings: parseInt(row.total_bookings),
      uniquePromosUsed: parseInt(row.unique_promos_used),
      promoUsagePercent: parseFloat(promoUsagePercent.toFixed(2)),
    }
  }

  /**
   * Get revenue trends over time
   */
  static async getRevenueTrends(dateFrom?: string, dateTo?: string, groupBy: "day" | "week" | "month" = "day") {
    let dateFormat = "%Y-%m-%d"
    if (groupBy === "week") {
      dateFormat = "%Y-W%W"
    } else if (groupBy === "month") {
      dateFormat = "%Y-%m"
    }

    let sql = `
      SELECT 
        strftime(?, created_at) as period,
        COUNT(*) as booking_count,
        COALESCE(SUM(final_amount), 0) as revenue
      FROM bookings
      WHERE payment_status IN ('paid', 'completed')
    `
    const params: any[] = [dateFormat]

    if (dateFrom) {
      params.push(dateFrom)
      // Use date comparison to include all bookings on that date
      sql += ` AND date(created_at) >= date(?)`
    }
    if (dateTo) {
      params.push(dateTo)
      // Use date comparison to include all bookings on that date
      sql += ` AND date(created_at) <= date(?)`
    }

    sql += ` GROUP BY period ORDER BY period ASC`

    return query(sql, params)
  }
}


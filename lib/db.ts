// Database connection utility for SQLite
// This file provides database connection helpers using Node.js built-in SQLite

import { DatabaseSync } from 'node:sqlite'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// Ensure data directory exists
const dataDir = join(process.cwd(), 'data')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

// Create SQLite database connection using Node.js built-in
const dbPath = join(dataDir, 'travelflow.db')
const database = new DatabaseSync(dbPath)

// Enable foreign keys
database.exec('PRAGMA foreign_keys = ON')

// Performance optimizations for SQLite
database.exec('PRAGMA journal_mode = WAL') // Write-Ahead Logging for better concurrency
database.exec('PRAGMA synchronous = NORMAL') // Balance between safety and speed
database.exec('PRAGMA cache_size = -64000') // 64MB cache (negative = KB)
database.exec('PRAGMA temp_store = MEMORY') // Store temp tables in memory
database.exec('PRAGMA mmap_size = 268435456') // 256MB memory-mapped I/O

// Helper to convert PostgreSQL placeholders ($1, $2) to SQLite (?)
function convertPlaceholders(sql: string): string {
  return sql.replace(/\$(\d+)/g, '?')
}

// Helper to convert PostgreSQL-specific SQL to SQLite
function convertSQL(sql: string): string {
  // Remove ::date casts
  sql = sql.replace(/::date/g, '')
  // Remove ::timestamp casts
  sql = sql.replace(/::timestamp/g, '')
  // Convert INTERVAL to date arithmetic
  sql = sql.replace(/CURRENT_DATE - INTERVAL '(\d+) days'/g, "date('now', '-$1 days')")
  sql = sql.replace(/CURRENT_DATE - INTERVAL '30 days'/g, "date('now', '-30 days')")
  // Convert PostgreSQL NOW() to SQLite datetime('now')
  sql = sql.replace(/NOW\(\)/gi, "datetime('now')")
  // Convert PostgreSQL version() to SQLite sqlite_version()
  sql = sql.replace(/\bversion\(\)/gi, "sqlite_version()")
  // Convert DISTINCT ON to subquery (simplified)
  sql = sql.replace(/DISTINCT ON \(([^)]+)\)/g, 'DISTINCT')
  // Convert FILTER (WHERE ...) to CASE WHEN
  sql = sql.replace(/COUNT\(([^)]+)\) FILTER \(WHERE ([^)]+)\)/g, "SUM(CASE WHEN $2 THEN 1 ELSE 0 END)")
  // Convert array_agg to GROUP_CONCAT (for simple cases)
  sql = sql.replace(/array_agg\(([^)]+)\)/g, "GROUP_CONCAT($1)")
  // Convert json_build_object to json_object (SQLite 3.38+)
  // For older versions, we'll handle this in post-processing
  return sql
}

// Execute SQL queries with parameterized statements (async wrapper for compatibility)
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  try {
    let sqliteSql = convertSQL(convertPlaceholders(sql))
    const stmt = database.prepare(sqliteSql)
    
    if (params && params.length > 0) {
      // Convert boolean to integer for SQLite
      const convertedParams = params.map(p => {
        if (typeof p === 'boolean') return p ? 1 : 0
        if (Array.isArray(p)) return JSON.stringify(p)
        return p
      })
      const result = stmt.all(...convertedParams) as T[]
      return result
    } else {
      const result = stmt.all() as T[]
      return result
    }
  } catch (error) {
    console.error('Database query error:', error)
    console.error('SQL:', sql)
    console.error('Params:', params)
    throw error
  }
}

// Execute a query that returns a single row
async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  try {
    let sqliteSql = convertSQL(convertPlaceholders(sql))
    const stmt = database.prepare(sqliteSql)
    
    if (params && params.length > 0) {
      const convertedParams = params.map(p => {
        if (typeof p === 'boolean') return p ? 1 : 0
        if (Array.isArray(p)) return JSON.stringify(p)
        return p
      })
      const result = stmt.get(...convertedParams) as T | undefined
      return result || null
    } else {
      const result = stmt.get() as T | undefined
      return result || null
    }
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// Execute a query that doesn't return rows (INSERT, UPDATE, DELETE)
async function execute(sql: string, params?: any[]): Promise<{ lastInsertRowid: number; changes: number }> {
  try {
    let sqliteSql = convertSQL(convertPlaceholders(sql))
    // Remove RETURNING clause if present (SQLite doesn't support it)
    sqliteSql = sqliteSql.replace(/\s+RETURNING\s+\*/gi, '')
    
    const stmt = database.prepare(sqliteSql)
    
    if (params && params.length > 0) {
      const convertedParams = params.map(p => {
        if (typeof p === 'boolean') return p ? 1 : 0
        if (Array.isArray(p)) return JSON.stringify(p)
        return p
      })
      const result = stmt.run(...convertedParams)
      // @ts-ignore - Node.js built-in SQLite returns bigint, Number() handles it
      return { lastInsertRowid: Number(result.lastInsertRowid ?? 0), changes: result.changes ?? 0 }
    } else {
      const result = stmt.run()
      // @ts-ignore - Node.js built-in SQLite returns bigint, Number() handles it
      return { lastInsertRowid: Number(result.lastInsertRowid ?? 0), changes: result.changes ?? 0 }
    }
  } catch (error) {
    console.error('Database execute error:', error)
    throw error
  }
}

// Close the connection pool (useful for cleanup)
export async function closePool() {
  database.close()
}

// Helper functions for common database operations
export const db = {
  // Raw query/execute functions
  query,
  execute,
  queryOne,

  // Users
  async getUserByEmail(email: string) {
    return query("SELECT * FROM users WHERE email = ?", [email])
  },

  async createUser(data: {
    email: string
    passwordHash: string
    firstName: string
    lastName: string
    phone?: string
    isStudent?: boolean
    studentId?: string
  }) {
    const result = await execute(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, is_student, student_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.email, data.passwordHash, data.firstName, data.lastName, data.phone || null, data.isStudent ? 1 : 0, data.studentId || null],
    )
    const users = await query("SELECT * FROM users WHERE id = ?", [result.lastInsertRowid])
    return users
  },

  // Email Verification
  async createEmailVerificationToken(userId: number, token: string, expiresAt: Date) {
    return execute(
      `UPDATE users 
       SET email_verification_token = ?, 
           email_verification_expires = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      [token, expiresAt.toISOString(), userId]
    )
  },

  async verifyEmail(token: string) {
    const users = await query(
      `SELECT * FROM users 
       WHERE email_verification_token = ? 
       AND datetime(email_verification_expires) > datetime('now')`,
      [token]
    )

    if (users.length === 0) {
      return null
    }

    const user = users[0]

    // Mark email as verified
    await execute(
      `UPDATE users 
       SET email_verified = 1, 
           email_verification_token = NULL,
           email_verification_expires = NULL,
           updated_at = datetime('now')
       WHERE id = ?`,
      [user.id]
    )

    return user
  },

  async resendEmailVerification(email: string) {
    const users = await this.getUserByEmail(email)
    if (users.length === 0) {
      return null
    }
    return users[0]
  },

  async getUserById(userId: number) {
    const users = await query("SELECT * FROM users WHERE id = ?", [userId])
    return users.length > 0 ? users[0] : null
  },

  async updateUserPassword(userId: number, newPasswordHash: string) {
    await execute(
      `UPDATE users 
       SET password_hash = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [newPasswordHash, userId]
    )
    return true
  },

  // Routes
  async getRoutes(filters?: {
    fromCity?: string
    toCity?: string
    fromState?: string
    toState?: string
    fromCountry?: string
    toCountry?: string
    date?: string
    vehicleType?: string
    transportType?: string
  }) {
    // Optimized query: Use subquery to get one schedule per route when date filter exists
    // This avoids DISTINCT and reduces JOIN complexity
    const hasDateFilter = !!filters?.date
    
    let sql = `
      SELECT 
        r.*, 
        o.name as operator_name, 
        o.rating, 
        o.total_reviews
    `
    
    if (hasDateFilter) {
      sql += `, 
        s.travel_date, 
        s.id as schedule_id,
        COALESCE((SELECT COUNT(*) FROM seat_bookings sb WHERE sb.schedule_id = s.id AND sb.status = 'booked'), 0) as booked_seats_count`
    } else {
      // When no date filter, get booked seats from the most recent upcoming schedule or all schedules
      sql += `, 
        NULL as travel_date, 
        NULL as schedule_id,
        COALESCE((
          SELECT COUNT(*) 
          FROM seat_bookings sb 
          INNER JOIN schedules s2 ON sb.schedule_id = s2.id 
          WHERE s2.route_id = r.id 
            AND s2.is_cancelled = 0
            AND sb.status = 'booked'
        ), 0) as booked_seats_count`
    }
    
    sql += `
      FROM routes r
      INNER JOIN operators o ON r.operator_id = o.id
    `
    
    if (hasDateFilter) {
      // Use subquery to get only one schedule per route for the specific date
      sql += `LEFT JOIN (
        SELECT route_id, available_seats, travel_date, id
        FROM schedules
        WHERE travel_date = date(?) AND is_cancelled = 0
      ) s ON r.id = s.route_id`
    }
    
    sql += ` WHERE r.status = 'active'`
    
    const params: any[] = []
    
    // Add date filter first if present (for JOIN condition)
    if (hasDateFilter) {
      params.push(filters.date)
    }

    // Use indexed columns - avoid LOWER() and use COLLATE NOCASE for case-insensitive search
    // Trim and normalize city names for better matching
    if (filters?.fromCity) {
      // Remove % signs if already present, then trim
      let fromCity = filters.fromCity.replace(/^%+|%+$/g, '').trim()
      // If empty after trimming, skip this filter
      if (fromCity) {
        // Use LIKE with wildcards for partial matching, case-insensitive
        params.push(`%${fromCity}%`)
        sql += ` AND r.from_city LIKE ? COLLATE NOCASE`
      }
    }
    if (filters?.toCity) {
      let toCity = filters.toCity.replace(/^%+|%+$/g, '').trim()
      if (toCity) {
        // Use LIKE with wildcards for partial matching, case-insensitive
        params.push(`%${toCity}%`)
        sql += ` AND r.to_city LIKE ? COLLATE NOCASE`
      }
    }
    if (filters?.fromState) {
      let fromState = filters.fromState.replace(/^%+|%+$/g, '').trim()
      if (fromState) {
        params.push(`%${fromState}%`)
        sql += ` AND r.from_state LIKE ? COLLATE NOCASE`
      }
    }
    if (filters?.toState) {
      let toState = filters.toState.replace(/^%+|%+$/g, '').trim()
      if (toState) {
        params.push(`%${toState}%`)
        sql += ` AND r.to_state LIKE ? COLLATE NOCASE`
      }
    }
    if (filters?.fromCountry) {
      let fromCountry = filters.fromCountry.replace(/^%+|%+$/g, '').trim()
      if (fromCountry) {
        params.push(`%${fromCountry}%`)
        sql += ` AND (r.from_country LIKE ? COLLATE NOCASE OR r.from_country IS NULL)`
      }
    }
    if (filters?.toCountry) {
      let toCountry = filters.toCountry.replace(/^%+|%+$/g, '').trim()
      if (toCountry) {
        params.push(`%${toCountry}%`)
        sql += ` AND (r.to_country LIKE ? COLLATE NOCASE OR r.to_country IS NULL)`
      }
    }
    if (filters?.transportType) {
      params.push(filters.transportType)
      sql += ` AND COALESCE(r.transport_type, 'bus') = ?`
    }
    if (filters?.vehicleType) {
      params.push(filters.vehicleType)
      sql += ` AND r.vehicle_type = ?`
    }

    sql += " ORDER BY r.id, r.departure_time LIMIT 500"

    return query(sql, params)
  },

  async getRouteById(routeId: number) {
    const result = await query(
      `SELECT r.*, o.name as operator_name, o.rating, o.total_reviews, o.email as operator_email, o.phone as operator_phone
       FROM routes r
       JOIN operators o ON r.operator_id = o.id
       WHERE r.id = ? AND r.status = 'active'`,
      [routeId]
    )
    return result[0] || null
  },

  async getSchedulesByRoute(routeId: number, date?: string) {
    let sql = `
      SELECT s.*, r.total_seats,
             (SELECT COUNT(*) FROM seat_bookings sb WHERE sb.schedule_id = s.id AND sb.status = 'booked') as booked_seats
      FROM schedules s
      JOIN routes r ON s.route_id = r.id
      WHERE s.route_id = ? AND s.is_cancelled = 0
    `
    const params: any[] = [routeId]

    if (date) {
      params.push(date)
      sql += ` AND s.travel_date = date(?)`
    }

    sql += `
      ORDER BY s.travel_date ASC
    `

    return query(sql, params)
  },

  async getSeatAvailability(scheduleId: number) {
    // Get all booked seats for this schedule
    console.log("[DB] getSeatAvailability called for scheduleId:", scheduleId)
    const bookedSeats = await query(
      `SELECT seat_number, status
       FROM seat_bookings
       WHERE schedule_id = ? AND status = 'booked'`,
      [scheduleId]
    )
    console.log("[DB] Raw booked seats from database:", bookedSeats.map((s: any) => s.seat_number))

    // Get schedule info to know total seats
    const schedule = await query(
      `SELECT s.*, r.total_seats
       FROM schedules s
       JOIN routes r ON s.route_id = r.id
       WHERE s.id = ?`,
      [scheduleId]
    )

    if (schedule.length === 0) {
      return { availableSeats: [], bookedSeats: [] }
    }

    const totalSeats = schedule[0].total_seats
    const bookedSeatNumbersRaw = bookedSeats.map((s: any) => s.seat_number)

    // Helper function to convert numeric format (like "3", "7", "2") to UI format (like "A3", "B3", "A2")
    const convertToUI = (seatNumber: string, totalSeats: number): string => {
      // If already in UI format (contains letter), return as-is
      if (/[A-Z]/.test(seatNumber)) {
        return seatNumber
      }
      
      // If numeric, convert to UI format
      const num = parseInt(seatNumber)
      if (isNaN(num) || num < 1 || num > totalSeats) {
        return seatNumber // Return as-is if invalid
      }
      
      const seatsPerRow = 4
      const seatLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"]
      const rowIndex = Math.floor((num - 1) / seatsPerRow)
      const colIndex = ((num - 1) % seatsPerRow) + 1
      const rowLabel = seatLabels[rowIndex] || seatNumber.charAt(0)
      
      return `${rowLabel}${colIndex}`
    }

    // Helper function to convert UI format (like "C4") to numeric format (like "4")
    // This handles both formats - if already numeric, return as-is
    const convertToNumeric = (seatNumber: string, totalSeats: number): string => {
      // If already numeric, return as-is
      if (/^\d+$/.test(seatNumber)) {
        return seatNumber
      }
      
      // If in UI format (contains letter), convert to numeric
      const seatLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"]
      const seatsPerRow = 4
      const rowLabel = seatNumber.charAt(0)
      const colIndex = parseInt(seatNumber.slice(1))
      const rowIndex = seatLabels.indexOf(rowLabel)
      
      if (rowIndex === -1 || isNaN(colIndex)) {
        // Invalid format, try to parse as number
        const num = parseInt(seatNumber)
        return isNaN(num) ? seatNumber : num.toString()
      }
      
      // Calculate numeric seat number: (rowIndex * seatsPerRow) + colIndex
      const numericSeat = (rowIndex * seatsPerRow) + colIndex
      return numericSeat.toString()
    }

    // Convert all booked seats to UI format for consistent return
    const bookedSeatsUI = bookedSeatNumbersRaw.map(seat => convertToUI(seat, totalSeats))
    
    // Convert all booked seats to numeric format for consistent comparison
    const bookedSeatNumbersNumeric = bookedSeatNumbersRaw.map(seat => convertToNumeric(seat, totalSeats))

    // Generate list of all seats in numeric format (1 to total_seats)
    const allSeats: string[] = []
    for (let i = 1; i <= totalSeats; i++) {
      allSeats.push(i.toString())
    }

    // Filter out booked seats (compare in numeric format)
    const availableSeats = allSeats.filter((seat) => !bookedSeatNumbersNumeric.includes(seat))

    // Always return booked seats in UI format for frontend consistency
    console.log("[DB] Returning booked seats in UI format:", bookedSeatsUI)
    return {
      availableSeats,
      bookedSeats: bookedSeatsUI, // Always return in UI format (e.g., "A3", "B3", "A4")
      totalSeats,
      availableCount: availableSeats.length,
      bookedCount: bookedSeatsUI.length,
    }
  },

  // Bookings
  async createBooking(data: {
    userId: number
    routeId: number
    scheduleId: number
    travelDate: string
    totalAmount: number
    discountAmount: number
    taxAmount: number
    finalAmount: number
    // promoCode?: string // Promo code commented out
    paymentMethod?: string
    contactEmail: string
    contactPhone: string
    passengers: Array<{
      seatNumber: string
      firstName: string
      lastName: string
      age: number
      gender: string
      passengerType?: string
    }>
    tripType?: 'one-way' | 'round-trip'
    roundTripId?: string
    isReturn?: boolean
  }) {
    // Import transaction utilities dynamically to avoid circular dependency
    const transactionModule = await import("@/lib/transaction")
    const { withTransaction, atomicSeatBookingInTransaction } = transactionModule
    
    // Generate booking ID and PNR
    const bookingId = "BK" + Date.now().toString().slice(-8)
    const pnr = "TF" + Math.random().toString(36).slice(2, 11).toUpperCase()
    const qrCodeData = "QR_" + Math.random().toString(36).slice(2, 18).toUpperCase()

    // Use transaction to ensure atomicity
    return withTransaction(async () => {
      // Insert booking
      const bookingResult = await execute(
        `INSERT INTO bookings 
         (booking_id, pnr, user_id, route_id, schedule_id, travel_date, 
          total_amount, discount_amount, tax_amount, final_amount, promo_code,
          payment_status, payment_method, booking_status, contact_email, contact_phone, qr_code_data,
          trip_type, round_trip_id, is_return)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bookingId,
          pnr,
          data.userId,
          data.routeId,
          data.scheduleId,
          data.travelDate,
          data.totalAmount,
          data.discountAmount,
          data.taxAmount,
          data.finalAmount,
          null, // data.promoCode || null, // Promo code commented out
          "completed", // Payment completed (no actual payment processing - user just enters details)
          data.paymentMethod || null,
          "confirmed",
          data.contactEmail,
          data.contactPhone,
          qrCodeData,
          data.tripType || 'one-way',
          data.roundTripId || null,
          data.isReturn ? 1 : 0,
        ],
      )

      const booking = await query("SELECT * FROM bookings WHERE id = ?", [bookingResult.lastInsertRowid])
      if (booking.length === 0) {
        throw new Error("Failed to create booking")
      }

      // Insert passengers
      for (const passenger of data.passengers) {
        await execute(
          `INSERT INTO passengers (booking_id, seat_number, first_name, last_name, age, gender, passenger_type)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [booking[0].id, passenger.seatNumber, passenger.firstName, passenger.lastName, passenger.age, passenger.gender, passenger.passengerType || 'adult'],
        )
      }

      // Use atomic seat booking to prevent race conditions and update available_seats
      // Use the in-transaction version since we're already in a transaction
      const seatNumbers = data.passengers.map(p => p.seatNumber)
      const seatBookingResult = await atomicSeatBookingInTransaction(booking[0].id, data.scheduleId, seatNumbers)
      
      if (!seatBookingResult.success) {
        throw new Error(seatBookingResult.error || "Failed to book seats")
      }

      // Promo code increment - Commented out
      // if (data.promoCode) {
      //   try {
      //     await execute(
      //       `UPDATE promo_codes SET used_count = used_count + 1 WHERE code = ?`,
      //       [data.promoCode]
      //     )
      //   } catch (err) {
      //     console.error("Error incrementing promo code usage:", err)
      //     // Don't fail the booking if promo increment fails
      //   }
      // }

      return booking[0]
    })
  },

  async getBookingsByUser(userId: number) {
    // Auto-complete bookings with past travel dates before fetching
    await this.autoCompletePastBookings()
    
    const results = await query(
      `SELECT b.*, r.from_city, r.to_city, r.departure_time, r.arrival_time,
              o.name as operator_name,
              GROUP_CONCAT(p.seat_number) as seats
       FROM bookings b
       JOIN routes r ON b.route_id = r.id
       JOIN operators o ON r.operator_id = o.id
       LEFT JOIN passengers p ON b.id = p.booking_id
       WHERE b.user_id = ?
       GROUP BY b.id, r.id, o.name
       ORDER BY b.travel_date DESC`,
      [userId],
    )
    // Convert GROUP_CONCAT string back to array
    return results.map((row: any) => ({
      ...row,
      seats: row.seats ? row.seats.split(',') : []
    }))
  },

  // Promo codes
  async validatePromoCode(code: string, userType = "all") {
    return query(
      `SELECT * FROM promo_codes
       WHERE code = ?
       AND is_active = 1
       AND valid_from <= date('now')
       AND valid_until >= date('now')
       AND (user_type = 'all' OR user_type = ?)
       AND (usage_limit IS NULL OR used_count < usage_limit)`,
      [code, userType],
    )
  },

  // Get active student promotions for signup page
  async getActiveStudentPromotions() {
    return query(
      `SELECT * FROM promo_codes
       WHERE user_type = 'student'
       AND is_active = 1
       AND valid_from <= date('now')
       AND valid_until >= date('now')
       AND (usage_limit IS NULL OR used_count < usage_limit)
       ORDER BY discount_value DESC
       LIMIT 1`
    )
  },

  // Get active first-time user promotions for signup page
  async getActiveFirstTimePromotions() {
    return query(
      `SELECT * FROM promo_codes
       WHERE user_type = 'first-time'
       AND is_active = 1
       AND valid_from <= date('now')
       AND valid_until >= date('now')
       AND (usage_limit IS NULL OR used_count < usage_limit)
       ORDER BY discount_value DESC
       LIMIT 1`
    )
  },

  // Increment promo code usage count
  async incrementPromoCodeUsageById(promoId: number) {
    return execute(
      `UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?`,
      [promoId]
    )
  },

  // Admin: Promo Code Management
  async getAllPromoCodes() {
    return query(`SELECT * FROM promo_codes ORDER BY created_at DESC`)
  },

  async createPromoCode(data: {
    code: string
    discountType: string
    discountValue: number
    userType?: string
    validFrom: string
    validUntil: string
    usageLimit?: number
    minAmount?: number
    maxDiscount?: number
    isActive?: boolean
  }) {
    const result = await execute(
      `INSERT INTO promo_codes (
        code, discount_type, discount_value, user_type, valid_from, valid_until,
        usage_limit, min_amount, max_discount, is_active, used_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        data.code,
        data.discountType,
        data.discountValue,
        data.userType || "all",
        data.validFrom,
        data.validUntil,
        data.usageLimit || null,
        data.minAmount || null,
        data.maxDiscount || null,
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      ]
    )
    const promos = await query("SELECT * FROM promo_codes WHERE id = ?", [result.lastInsertRowid])
    return promos
  },

  async updatePromoCode(promoId: number, data: {
    code?: string
    discountType?: string
    discountValue?: number
    userType?: string
    validFrom?: string
    validUntil?: string
    usageLimit?: number
    minAmount?: number
    maxDiscount?: number
    isActive?: boolean
  }) {
    const updates: string[] = []
    const params: any[] = []

    if (data.code !== undefined) {
      updates.push(`code = ?`)
      params.push(data.code)
    }
    if (data.discountType !== undefined) {
      updates.push(`discount_type = ?`)
      params.push(data.discountType)
    }
    if (data.discountValue !== undefined) {
      updates.push(`discount_value = ?`)
      params.push(data.discountValue)
    }
    if (data.userType !== undefined) {
      updates.push(`user_type = ?`)
      params.push(data.userType)
    }
    if (data.validFrom !== undefined) {
      updates.push(`valid_from = ?`)
      params.push(data.validFrom)
    }
    if (data.validUntil !== undefined) {
      updates.push(`valid_until = ?`)
      params.push(data.validUntil)
    }
    if (data.usageLimit !== undefined) {
      updates.push(`usage_limit = ?`)
      params.push(data.usageLimit === null ? null : data.usageLimit)
    }
    if (data.minAmount !== undefined) {
      updates.push(`min_amount = ?`)
      params.push(data.minAmount === null ? null : data.minAmount)
    }
    if (data.maxDiscount !== undefined) {
      updates.push(`max_discount = ?`)
      params.push(data.maxDiscount === null ? null : data.maxDiscount)
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = ?`)
      params.push(data.isActive ? 1 : 0)
    }

    if (updates.length === 0) {
      return query(`SELECT * FROM promo_codes WHERE id = ?`, [promoId])
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    params.push(promoId)

    const result = await execute(
      `UPDATE promo_codes SET ${updates.join(', ')} WHERE id = ?`,
      params
    )
    const promos = await query("SELECT * FROM promo_codes WHERE id = ?", [promoId])
    return promos
  },

  async togglePromoCode(promoId: number) {
    // Get current status
    const current = await query(`SELECT is_active FROM promo_codes WHERE id = ?`, [promoId])
    if (current.length === 0) {
      throw new Error("Promo code not found")
    }
    
    // Handle both integer (0/1) and boolean values from SQLite
    const currentStatus = current[0].is_active
    const isCurrentlyActive = currentStatus === 1 || currentStatus === true || currentStatus === '1'
    const newStatus = isCurrentlyActive ? 0 : 1

    // Update the status
    await execute(
      `UPDATE promo_codes SET is_active = ? WHERE id = ?`,
      [newStatus, promoId]
    )
    
    // Return the updated promo code
    const promos = await query("SELECT * FROM promo_codes WHERE id = ?", [promoId])
    return promos
  },

  async incrementPromoCodeUsage(promoCode: string) {
    await execute(
      `UPDATE promo_codes SET used_count = used_count + 1 WHERE code = ?`,
      [promoCode]
    )
  },

  // Auto-complete bookings with past travel dates
  async autoCompletePastBookings() {
    try {
      // Update bookings where travel_date has passed and status is not already completed or cancelled
      const result = await execute(
        `UPDATE bookings 
         SET booking_status = 'completed', updated_at = datetime('now')
         WHERE travel_date < date('now') 
           AND booking_status NOT IN ('completed', 'cancelled')`,
        []
      )
      
      // Return count of updated bookings (if supported by database)
      return result.changes || 0
    } catch (error) {
      console.error("Error auto-completing past bookings:", error)
      // Don't throw - this is a background operation
      return 0
    }
  },

  // Admin: Booking Management
  async getAllBookings(filters?: {
    routeId?: number
    dateFrom?: string
    dateTo?: string
    status?: string
    paymentStatus?: string
    vehicleType?: string
  }) {
    // Auto-complete bookings with past travel dates before fetching
    await this.autoCompletePastBookings()
    let sql = `
      SELECT b.*, r.from_city, r.from_state, r.from_country, r.to_city, r.to_state, r.to_country,
             r.departure_time, r.arrival_time, r.vehicle_type, r.transport_type,
             o.name as operator_name,
             u.first_name || ' ' || u.last_name as user_name,
             u.email as user_email,
             GROUP_CONCAT(p.seat_number) as seats,
             GROUP_CONCAT(p.first_name || ' ' || p.last_name) as passenger_names
      FROM bookings b
      JOIN routes r ON b.route_id = r.id
      JOIN operators o ON r.operator_id = o.id
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN passengers p ON b.id = p.booking_id
      WHERE 1=1
    `
    const params: any[] = []

    if (filters?.routeId) {
      params.push(filters.routeId)
      sql += ` AND b.route_id = ?`
    }
    if (filters?.dateFrom) {
      params.push(filters.dateFrom)
      sql += ` AND b.travel_date >= date(?)`
    }
    if (filters?.dateTo) {
      params.push(filters.dateTo)
      sql += ` AND b.travel_date <= date(?)`
    }
    if (filters?.status) {
      params.push(filters.status)
      sql += ` AND b.booking_status = ?`
    }
    if (filters?.paymentStatus) {
      params.push(filters.paymentStatus)
      sql += ` AND b.payment_status = ?`
    }
    if (filters?.vehicleType) {
      params.push(filters.vehicleType)
      sql += ` AND r.vehicle_type = ?`
    }

    sql += ` GROUP BY b.id, r.id, o.id, u.id ORDER BY b.created_at DESC`

    const results = await query(sql, params)
    // Convert GROUP_CONCAT strings back to arrays
    return results.map((row: any) => ({
      ...row,
      seats: row.seats ? row.seats.split(',') : [],
      passenger_names: row.passenger_names ? row.passenger_names.split(',') : []
    }))
  },

  async getBookingById(bookingId: number) {
    const result = await query(
      `SELECT b.*, r.from_city, r.from_state, r.to_city, r.to_state,
              r.departure_time, r.arrival_time, r.vehicle_type, r.duration_minutes,
              o.name as operator_name,
              u.first_name || ' ' || u.last_name as user_name,
              u.email as user_email
       FROM bookings b
       JOIN routes r ON b.route_id = r.id
       JOIN operators o ON r.operator_id = o.id
       LEFT JOIN users u ON b.user_id = u.id
       WHERE b.id = ?`,
      [bookingId]
    )
    
    if (result.length === 0) {
      return null
    }

    // Get passengers separately
    const passengers = await query(
      `SELECT seat_number, first_name, last_name, age, gender
       FROM passengers
       WHERE booking_id = ?`,
      [bookingId]
    )

    return {
      ...result[0],
      passengers: passengers.map((p: any) => ({
        seatNumber: p.seat_number,
        firstName: p.first_name,
        lastName: p.last_name,
        age: p.age,
        gender: p.gender
      }))
    }
  },

  async getBookingByPNR(pnr: string) {
    const result = await query(
      `SELECT b.*, r.from_city, r.from_state, r.to_city, r.to_state,
              r.departure_time, r.arrival_time, r.vehicle_type, r.duration_minutes,
              o.name as operator_name,
              u.first_name || ' ' || u.last_name as user_name,
              u.email as user_email
       FROM bookings b
       JOIN routes r ON b.route_id = r.id
       JOIN operators o ON r.operator_id = o.id
       LEFT JOIN users u ON b.user_id = u.id
       WHERE b.pnr = ?`,
      [pnr]
    )
    
    if (result.length === 0) {
      return null
    }

    const bookingId = result[0].id

    // Get passengers separately
    const passengers = await query(
      `SELECT seat_number, first_name, last_name, age, gender
       FROM passengers
       WHERE booking_id = ?`,
      [bookingId]
    )

    return {
      ...result[0],
      passengers: passengers.map((p: any) => ({
        seatNumber: p.seat_number,
        firstName: p.first_name,
        lastName: p.last_name,
        age: p.age,
        gender: p.gender
      }))
    }
  },

  async updateBookingStatus(bookingId: number, status: string) {
    await execute(
      `UPDATE bookings SET booking_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, bookingId]
    )
    const bookings = await query("SELECT * FROM bookings WHERE id = ?", [bookingId])
    return bookings
  },

  async processRefund(bookingId: number) {
    await execute(
      `UPDATE bookings 
       SET booking_status = 'cancelled', 
           payment_status = 'refunded',
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [bookingId]
    )
    const bookings = await query("SELECT * FROM bookings WHERE id = ?", [bookingId])
    return bookings
  },

  // Admin queries
  async getBookingStats() {
    return query(`
      SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(final_amount), 0) as total_revenue,
        COUNT(DISTINCT user_id) as total_customers,
        SUM(CASE WHEN booking_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings
      FROM bookings
      WHERE created_at >= date('now', '-30 days')
    `)
  },

  async getPopularRoutes() {
    return query(`
      SELECT 
        r.from_city, r.to_city,
        COUNT(b.id) as booking_count,
        COALESCE(SUM(b.final_amount), 0) as total_revenue
      FROM routes r
      JOIN bookings b ON r.id = b.route_id
      WHERE b.created_at >= date('now', '-30 days')
      GROUP BY r.id, r.from_city, r.to_city
      ORDER BY booking_count DESC
      LIMIT 10
    `)
  },

  // Admin: Routes Management
  async getAllRoutes() {
    return query(
      `SELECT r.*, o.name as operator_name, o.email as operator_email, o.phone as operator_phone
       FROM routes r
       JOIN operators o ON r.operator_id = o.id
       ORDER BY r.created_at DESC`
    )
  },

  // Check if route with same combination exists
  async checkRouteExists(
    fromCity: string,
    fromState: string,
    toCity: string,
    toState: string,
    operatorId: number,
    departureTime: string,
    excludeId?: number,
    fromCountry?: string,
    toCountry?: string
  ): Promise<boolean> {
    let sql = `
      SELECT id FROM routes 
      WHERE LOWER(TRIM(from_city)) = LOWER(TRIM(?))
        AND LOWER(TRIM(from_state)) = LOWER(TRIM(?))
        AND LOWER(TRIM(to_city)) = LOWER(TRIM(?))
        AND LOWER(TRIM(to_state)) = LOWER(TRIM(?))
        AND operator_id = ?
        AND departure_time = ?
    `
    const params: any[] = [fromCity, fromState, toCity, toState, operatorId, departureTime]
    
    // Add country checks if provided (for better duplicate detection)
    if (fromCountry) {
      sql += ` AND (from_country IS NULL OR LOWER(TRIM(from_country)) = LOWER(TRIM(?)))`
      params.push(fromCountry)
    } else {
      sql += ` AND from_country IS NULL`
    }
    
    if (toCountry) {
      sql += ` AND (to_country IS NULL OR LOWER(TRIM(to_country)) = LOWER(TRIM(?)))`
      params.push(toCountry)
    } else {
      sql += ` AND to_country IS NULL`
    }
    
    if (excludeId) {
      sql += ` AND id != ?`
      params.push(excludeId)
    }
    
    const result = await query(sql, params)
    return result.length > 0
  },

  async createRoute(data: {
    operatorId: number
    fromCity: string
    fromState: string
    toCity: string
    toState: string
    departureTime: string
    arrivalTime: string
    durationMinutes: number
    vehicleType: string
    totalSeats: number
    basePrice: number
    amenities?: string[]
    status?: string
    transportType?: string
    fromCountry?: string
    toCountry?: string
  }) {
    // Normalize input data for duplicate checking
    const normalizedFromCity = data.fromCity.trim()
    const normalizedFromState = data.fromState.trim()
    const normalizedToCity = data.toCity.trim()
    const normalizedToState = data.toState.trim()
    const normalizedDepartureTime = data.departureTime.trim()
    const normalizedFromCountry = data.fromCountry?.trim() || null
    const normalizedToCountry = data.toCountry?.trim() || null
    
    // Check for duplicate route
    const exists = await this.checkRouteExists(
      normalizedFromCity,
      normalizedFromState,
      normalizedToCity,
      normalizedToState,
      data.operatorId,
      normalizedDepartureTime,
      undefined,
      normalizedFromCountry || undefined,
      normalizedToCountry || undefined
    )
    if (exists) {
      throw new Error(
        `Route already exists: ${normalizedFromCity}, ${normalizedFromState}${normalizedFromCountry ? `, ${normalizedFromCountry}` : ''} → ${normalizedToCity}, ${normalizedToState}${normalizedToCountry ? `, ${normalizedToCountry}` : ''} ` +
        `with operator ${data.operatorId} at ${normalizedDepartureTime}`
      )
    }

    const result = await execute(
      `INSERT INTO routes (
        operator_id, from_city, from_state, from_country, to_city, to_state, to_country,
        departure_time, arrival_time, duration_minutes, vehicle_type,
        total_seats, base_price, amenities, status, transport_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.operatorId,
        normalizedFromCity,
        normalizedFromState,
        normalizedFromCountry,
        normalizedToCity,
        normalizedToState,
        normalizedToCountry,
        normalizedDepartureTime,
        data.arrivalTime.trim(),
        data.durationMinutes,
        data.vehicleType.trim(),
        data.totalSeats,
        data.basePrice,
        data.amenities ? JSON.stringify(data.amenities) : null,
        data.status || 'active',
        data.transportType || 'bus',
      ]
    )
    const routes = await query("SELECT * FROM routes WHERE id = ?", [result.lastInsertRowid])
    return routes
  },

  async updateRoute(routeId: number, data: {
    operatorId?: number
    fromCity?: string
    fromState?: string
    fromCountry?: string
    toCity?: string
    toState?: string
    toCountry?: string
    departureTime?: string
    arrivalTime?: string
    durationMinutes?: number
    vehicleType?: string
    totalSeats?: number
    basePrice?: number
    amenities?: string[]
    status?: string
    transportType?: string
  }) {
    // Get current route to check for duplicates with updated values
    const currentRoute = await this.getRouteById(routeId)
    if (!currentRoute) {
      throw new Error("Route not found")
    }

    // Use updated values or fall back to current values for duplicate check
    const fromCity = data.fromCity ?? currentRoute.from_city
    const fromState = data.fromState ?? currentRoute.from_state
    const fromCountry = data.fromCountry ?? currentRoute.from_country ?? undefined
    const toCity = data.toCity ?? currentRoute.to_city
    const toState = data.toState ?? currentRoute.to_state
    const toCountry = data.toCountry ?? currentRoute.to_country ?? undefined
    const operatorId = data.operatorId ?? currentRoute.operator_id
    const departureTime = data.departureTime ?? currentRoute.departure_time

    // Check for duplicate route (excluding current route)
    const exists = await this.checkRouteExists(
      fromCity,
      fromState,
      toCity,
      toState,
      operatorId,
      departureTime,
      routeId,
      fromCountry,
      toCountry
    )
    if (exists) {
      throw new Error(
        `Route already exists: ${fromCity}, ${fromState}${fromCountry ? `, ${fromCountry}` : ''} → ${toCity}, ${toState}${toCountry ? `, ${toCountry}` : ''} ` +
        `with operator ${operatorId} at ${departureTime}`
      )
    }

    const updates: string[] = []
    const params: any[] = []

    if (data.operatorId !== undefined) {
      updates.push(`operator_id = ?`)
      params.push(data.operatorId)
    }
    if (data.fromCity !== undefined) {
      updates.push(`from_city = ?`)
      params.push(data.fromCity)
    }
    if (data.fromState !== undefined) {
      updates.push(`from_state = ?`)
      params.push(data.fromState)
    }
    if (data.fromCountry !== undefined) {
      updates.push(`from_country = ?`)
      params.push(data.fromCountry || null)
    }
    if (data.toCity !== undefined) {
      updates.push(`to_city = ?`)
      params.push(data.toCity)
    }
    if (data.toState !== undefined) {
      updates.push(`to_state = ?`)
      params.push(data.toState)
    }
    if (data.toCountry !== undefined) {
      updates.push(`to_country = ?`)
      params.push(data.toCountry || null)
    }
    if (data.departureTime !== undefined) {
      updates.push(`departure_time = ?`)
      params.push(data.departureTime)
    }
    if (data.arrivalTime !== undefined) {
      updates.push(`arrival_time = ?`)
      params.push(data.arrivalTime)
    }
    if (data.durationMinutes !== undefined) {
      updates.push(`duration_minutes = ?`)
      params.push(data.durationMinutes)
    }
    if (data.vehicleType !== undefined) {
      updates.push(`vehicle_type = ?`)
      params.push(data.vehicleType)
    }
    if (data.totalSeats !== undefined) {
      updates.push(`total_seats = ?`)
      params.push(data.totalSeats)
    }
    if (data.basePrice !== undefined) {
      updates.push(`base_price = ?`)
      params.push(data.basePrice)
    }
    if (data.amenities !== undefined) {
      updates.push(`amenities = ?`)
      params.push(data.amenities ? JSON.stringify(data.amenities) : null)
    }
    if (data.status !== undefined) {
      updates.push(`status = ?`)
      params.push(data.status)
    }
    if (data.transportType !== undefined) {
      updates.push(`transport_type = ?`)
      params.push(data.transportType)
    }

    if (updates.length === 0) {
      return query(`SELECT * FROM routes WHERE id = ?`, [routeId])
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    params.push(routeId)

    await execute(
      `UPDATE routes SET ${updates.join(', ')} WHERE id = ?`,
      params
    )
    const routes = await query("SELECT * FROM routes WHERE id = ?", [routeId])
    return routes
  },

  async deleteRoute(routeId: number) {
    // Check if route has active bookings
    const bookings = await query(
      `SELECT COUNT(*) as count FROM bookings WHERE route_id = ? AND booking_status != 'cancelled'`,
      [routeId]
    )

    if (bookings[0]?.count > 0) {
      throw new Error('Cannot delete route with active bookings')
    }

    await execute(
      `UPDATE routes SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [routeId]
    )
    const routes = await query("SELECT * FROM routes WHERE id = ?", [routeId])
    return routes
  },

  // Admin: Operators Management
  async getAllOperators() {
    return query(`SELECT * FROM operators ORDER BY name`)
  },

  // Check if operator with same name exists (case-insensitive)
  async checkOperatorExists(name: string, excludeId?: number): Promise<boolean> {
    let sql = `SELECT id FROM operators WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))`
    const params: any[] = [name]
    
    if (excludeId) {
      sql += ` AND id != ?`
      params.push(excludeId)
    }
    
    const result = await query(sql, params)
    return result.length > 0
  },

  async createOperator(data: {
    name: string
    email?: string
    phone?: string
  }) {
    // Check for duplicate operator name
    const exists = await this.checkOperatorExists(data.name)
    if (exists) {
      throw new Error(`Operator with name "${data.name}" already exists`)
    }

    const result = await execute(
      `INSERT INTO operators (name, email, phone) VALUES (?, ?, ?)`,
      [data.name, data.email || null, data.phone || null]
    )
    const operators = await query("SELECT * FROM operators WHERE id = ?", [result.lastInsertRowid])
    return operators
  },

  // Admin: Recurring Schedules
  async getAllRecurringSchedules() {
    return query(
      `SELECT rs.*, r.from_city, r.from_state, r.to_city, r.to_state, o.name as operator_name
       FROM recurring_schedules rs
       JOIN routes r ON rs.route_id = r.id
       JOIN operators o ON r.operator_id = o.id
       ORDER BY rs.created_at DESC`
    )
  },

  async getRecurringScheduleById(scheduleId: number) {
    const result = await query(
      `SELECT * FROM recurring_schedules WHERE id = ?`,
      [scheduleId]
    )
    return result[0] || null
  },

  async createRecurringSchedule(data: {
    routeId: number
    recurrenceType: string
    recurrenceDays?: string[]
    startDate: string
    endDate: string
    departureTime: string
    arrivalTime: string
    priceOverride?: number
    seatCapacityOverride?: number
    status?: string
  }) {
    const result = await execute(
      `INSERT INTO recurring_schedules (
        route_id, recurrence_type, recurrence_days, start_date, end_date,
        departure_time, arrival_time, price_override, seat_capacity_override, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.routeId,
        data.recurrenceType,
        data.recurrenceDays ? JSON.stringify(data.recurrenceDays) : null,
        data.startDate,
        data.endDate,
        data.departureTime,
        data.arrivalTime,
        data.priceOverride || null,
        data.seatCapacityOverride || null,
        data.status || 'active',
      ]
    )
    const schedules = await query("SELECT * FROM recurring_schedules WHERE id = ?", [result.lastInsertRowid])
    return schedules
  },

  async updateRecurringSchedule(scheduleId: number, data: {
    routeId?: number
    recurrenceType?: string
    recurrenceDays?: string[]
    startDate?: string
    endDate?: string
    departureTime?: string
    arrivalTime?: string
    priceOverride?: number
    seatCapacityOverride?: number
    status?: string
  }) {
    const updates: string[] = []
    const params: any[] = []

    if (data.routeId !== undefined) {
      updates.push(`route_id = ?`)
      params.push(data.routeId)
    }
    if (data.recurrenceType !== undefined) {
      updates.push(`recurrence_type = ?`)
      params.push(data.recurrenceType)
    }
    if (data.recurrenceDays !== undefined) {
      updates.push(`recurrence_days = ?`)
      params.push(data.recurrenceDays ? JSON.stringify(data.recurrenceDays) : null)
    }
    if (data.startDate !== undefined) {
      updates.push(`start_date = ?`)
      params.push(data.startDate)
    }
    if (data.endDate !== undefined) {
      updates.push(`end_date = ?`)
      params.push(data.endDate)
    }
    if (data.departureTime !== undefined) {
      updates.push(`departure_time = ?`)
      params.push(data.departureTime)
    }
    if (data.arrivalTime !== undefined) {
      updates.push(`arrival_time = ?`)
      params.push(data.arrivalTime)
    }
    if (data.priceOverride !== undefined) {
      updates.push(`price_override = ?`)
      params.push(data.priceOverride)
    }
    if (data.seatCapacityOverride !== undefined) {
      updates.push(`seat_capacity_override = ?`)
      params.push(data.seatCapacityOverride)
    }
    if (data.status !== undefined) {
      updates.push(`status = ?`)
      params.push(data.status)
    }

    if (updates.length === 0) {
      return query(`SELECT * FROM recurring_schedules WHERE id = ?`, [scheduleId])
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    params.push(scheduleId)

    await execute(
      `UPDATE recurring_schedules SET ${updates.join(', ')} WHERE id = ?`,
      params
    )
    const schedules = await query("SELECT * FROM recurring_schedules WHERE id = ?", [scheduleId])
    return schedules
  },

  async disableRecurringSchedule(scheduleId: number) {
    await execute(
      `UPDATE recurring_schedules SET status = 'disabled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [scheduleId]
    )
    const schedules = await query("SELECT * FROM recurring_schedules WHERE id = ?", [scheduleId])
    return schedules
  },

  // Admin: Schedule Management
  async getAllSchedules(filters?: {
    routeId?: number
    dateFrom?: string
    dateTo?: string
    isCancelled?: boolean
  }) {
    try {
      let sql = `
        SELECT s.id, s.route_id, s.travel_date, s.available_seats, s.is_cancelled, s.created_at,
               COALESCE(r.from_city, '') as from_city, 
               COALESCE(r.from_state, '') as from_state, 
               COALESCE(r.to_city, '') as to_city, 
               COALESCE(r.to_state, '') as to_state, 
               COALESCE(r.departure_time, '') as route_departure_time, 
               COALESCE(r.arrival_time, '') as route_arrival_time,
               COALESCE(r.vehicle_type, '') as vehicle_type, 
               COALESCE(r.base_price, 0) as base_price,
               COALESCE(dpo.price_override, r.base_price) as final_price,
               COALESCE(o.name, 'Unknown') as operator_name
        FROM schedules s
        LEFT JOIN routes r ON s.route_id = r.id
        LEFT JOIN operators o ON r.operator_id = o.id
        LEFT JOIN date_price_overrides dpo ON s.route_id = dpo.route_id AND s.travel_date = dpo.travel_date
        WHERE 1=1
      `
      const params: any[] = []

      if (filters?.routeId) {
        params.push(filters.routeId)
        sql += ` AND s.route_id = ?`
      }
      if (filters?.dateFrom) {
        params.push(filters.dateFrom)
        sql += ` AND s.travel_date >= date(?)`
      }
      if (filters?.dateTo) {
        params.push(filters.dateTo)
        sql += ` AND s.travel_date <= date(?)`
      }
      if (filters?.isCancelled !== undefined) {
        params.push(filters.isCancelled ? 1 : 0)
        sql += ` AND s.is_cancelled = ?`
      }

      sql += ` ORDER BY s.travel_date ASC, s.created_at DESC`

      const results = await query(sql, params)
      
      // Add booked_seats count and calculate final price if not already set
      for (const schedule of results) {
        try {
          const bookedSeatsResult = await query<{ count: number }>(
            `SELECT COUNT(*) as count FROM seat_bookings WHERE schedule_id = ? AND status = 'booked'`,
            [schedule.id]
          )
          schedule.booked_seats = bookedSeatsResult[0]?.count || 0
          
          // If final_price is not set (no override), calculate it dynamically
          if (!schedule.final_price || schedule.final_price === schedule.base_price) {
            try {
              schedule.final_price = await this.calculateSchedulePrice(
                schedule.route_id,
                schedule.travel_date
              )
            } catch (error) {
              // Fallback to base_price if calculation fails
              schedule.final_price = schedule.base_price
            }
          }
        } catch (error) {
          console.error(`Error getting booked seats for schedule ${schedule.id}:`, error)
          schedule.booked_seats = 0
          schedule.final_price = schedule.base_price || 0
        }
      }
      
      return results
    } catch (error) {
      console.error('Error in getAllSchedules:', error)
      throw error
    }
  },

  async getScheduleByIdAdmin(scheduleId: number) {
    const result = await query(
      `SELECT s.*, r.from_city, r.from_state, r.to_city, r.to_state,
              r.departure_time, r.arrival_time, r.vehicle_type, r.base_price,
              o.name as operator_name
       FROM schedules s
       JOIN routes r ON s.route_id = r.id
       JOIN operators o ON r.operator_id = o.id
       WHERE s.id = ?`,
      [scheduleId]
    )
    return result[0] || null
  },

  // Check if schedule with same route_id and travel_date exists
  async checkScheduleExists(routeId: number, travelDate: string, excludeId?: number): Promise<boolean> {
    let sql = `SELECT id FROM schedules WHERE route_id = ? AND travel_date = date(?)`
    const params: any[] = [routeId, travelDate]
    
    if (excludeId) {
      sql += ` AND id != ?`
      params.push(excludeId)
    }
    
    const result = await query(sql, params)
    return result.length > 0
  },

  async createSchedule(data: {
    routeId: number
    travelDate: string
    availableSeats?: number
    isCancelled?: boolean
  }) {
    // Check if schedule already exists
    const exists = await this.checkScheduleExists(data.routeId, data.travelDate)
    if (exists) {
      throw new Error("Schedule already exists for this route and date")
    }

    // Get route to get default seat count
    const route = await this.getRouteById(data.routeId)
    if (!route) {
      throw new Error("Route not found")
    }

    const seatCount = data.availableSeats || route.total_seats

    const result = await execute(
      `INSERT INTO schedules (route_id, travel_date, available_seats, is_cancelled)
       VALUES (?, date(?), ?, ?)`,
      [data.routeId, data.travelDate, seatCount, data.isCancelled ? 1 : 0]
    )
    const schedules = await query("SELECT * FROM schedules WHERE id = ?", [result.lastInsertRowid])
    return schedules
  },

  // Dynamic Pricing: Date Price Overrides
  async setDatePriceOverride(routeId: number, travelDate: string, price: number, reason?: string) {
    await execute(
      `INSERT OR REPLACE INTO date_price_overrides (route_id, travel_date, price_override, reason, updated_at)
       VALUES (?, date(?), ?, ?, CURRENT_TIMESTAMP)`,
      [routeId, travelDate, price, reason || 'manual']
    )
  },

  async getDatePriceOverride(routeId: number, travelDate: string) {
    const result = await query(
      `SELECT * FROM date_price_overrides WHERE route_id = ? AND travel_date = date(?)`,
      [routeId, travelDate]
    )
    return result[0] || null
  },

  async deleteDatePriceOverride(routeId: number, travelDate: string) {
    await execute(
      `DELETE FROM date_price_overrides WHERE route_id = ? AND travel_date = date(?)`,
      [routeId, travelDate]
    )
  },

  // Dynamic Pricing: Holidays
  async createHoliday(name: string, date: string, type: string = 'national', isRecurring: boolean = false, priceMultiplier: number = 1.5) {
    const result = await execute(
      `INSERT INTO holidays (name, date, type, is_recurring, price_multiplier)
       VALUES (?, date(?), ?, ?, ?)`,
      [name, date, type, isRecurring ? 1 : 0, priceMultiplier]
    )
    const holidays = await query("SELECT * FROM holidays WHERE id = ?", [result.lastInsertRowid])
    return holidays[0]
  },

  async getAllHolidays(year?: number) {
    let sql = `SELECT * FROM holidays WHERE 1=1`
    const params: any[] = []
    
    if (year) {
      sql += ` AND (strftime('%Y', date) = ? OR is_recurring = 1)`
      params.push(year.toString())
    }
    
    sql += ` ORDER BY date ASC`
    return query(sql, params)
  },

  async isHoliday(date: string): Promise<{ isHoliday: boolean; holiday?: any }> {
    const dateObj = new Date(date)
    const year = dateObj.getFullYear()
    const month = dateObj.getMonth() + 1
    const day = dateObj.getDate()
    
    // Check exact date
    const exactMatch = await query(
      `SELECT * FROM holidays WHERE date = date(?)`,
      [date]
    )
    
    if (exactMatch.length > 0) {
      return { isHoliday: true, holiday: exactMatch[0] }
    }
    
    // Check recurring holidays (same month and day, different year)
    const recurring = await query(
      `SELECT * FROM holidays 
       WHERE is_recurring = 1 
       AND strftime('%m', date) = ? 
       AND strftime('%d', date) = ?`,
      [month.toString().padStart(2, '0'), day.toString().padStart(2, '0')]
    )
    
    if (recurring.length > 0) {
      return { isHoliday: true, holiday: recurring[0] }
    }
    
    return { isHoliday: false }
  },

  // Dynamic Pricing: Recurring Schedule Price Rules
  async setRecurringSchedulePriceRule(recurringScheduleId: number, dayOfWeek: string | null, priceMultiplier?: number, fixedPrice?: number) {
    await execute(
      `INSERT OR REPLACE INTO recurring_schedule_price_rules 
       (recurring_schedule_id, day_of_week, price_multiplier, fixed_price, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [recurringScheduleId, dayOfWeek, priceMultiplier || 1.0, fixedPrice || null]
    )
  },

  async getRecurringSchedulePriceRules(recurringScheduleId: number) {
    return query(
      `SELECT * FROM recurring_schedule_price_rules WHERE recurring_schedule_id = ?`,
      [recurringScheduleId]
    )
  },

  async deleteRecurringSchedulePriceRule(ruleId: number) {
    await execute(
      `DELETE FROM recurring_schedule_price_rules WHERE id = ?`,
      [ruleId]
    )
  },

  // Calculate final price for a schedule considering all pricing factors
  async calculateSchedulePrice(routeId: number, travelDate: string, recurringScheduleId?: number): Promise<number> {
    // Get base route price
    const route = await this.getRouteById(routeId)
    if (!route) {
      throw new Error("Route not found")
    }
    let finalPrice = route.base_price

    // 1. Check for date-specific override (highest priority)
    const dateOverride = await this.getDatePriceOverride(routeId, travelDate)
    if (dateOverride) {
      return dateOverride.price_override
    }

    // 2. Check for recurring schedule price rules
    if (recurringScheduleId) {
      const dateObj = new Date(travelDate)
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
      
      // Check for day-specific rule
      const dayRule = await query(
        `SELECT * FROM recurring_schedule_price_rules 
         WHERE recurring_schedule_id = ? AND day_of_week = ?`,
        [recurringScheduleId, dayOfWeek]
      )
      
      if (dayRule.length > 0) {
        const rule = dayRule[0]
        if (rule.fixed_price) {
          return rule.fixed_price
        } else {
          finalPrice = route.base_price * rule.price_multiplier
        }
      } else {
        // Check for general rule (no day_of_week specified)
        const generalRule = await query(
          `SELECT * FROM recurring_schedule_price_rules 
           WHERE recurring_schedule_id = ? AND day_of_week IS NULL`,
          [recurringScheduleId]
        )
        
        if (generalRule.length > 0) {
          const rule = generalRule[0]
          if (rule.fixed_price) {
            return rule.fixed_price
          } else {
            finalPrice = route.base_price * rule.price_multiplier
          }
        }
      }
    }

    // 3. Check for holiday pricing
    const holidayCheck = await this.isHoliday(travelDate)
    if (holidayCheck.isHoliday && holidayCheck.holiday) {
      finalPrice = finalPrice * holidayCheck.holiday.price_multiplier
    }

    // 4. Check for weekend pricing (Saturday/Sunday)
    const dateObj = new Date(travelDate)
    const dayOfWeek = dateObj.getDay() // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend pricing: 10% increase (can be configured)
      finalPrice = finalPrice * 1.1
    }

    return Math.round(finalPrice * 100) / 100 // Round to 2 decimal places
  },

  async cancelSchedule(scheduleId: number) {
    // Update schedule
    await execute(
      `UPDATE schedules SET is_cancelled = 1 WHERE id = ?`,
      [scheduleId]
    )

    // Get all bookings for this schedule with user and route details
    const bookings = await query(
      `SELECT b.id, b.booking_status, b.pnr, b.total_amount,
              u.email, u.first_name, u.last_name,
              r.from_city, r.to_city, s.travel_date
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN routes r ON b.route_id = r.id
       JOIN schedules s ON b.schedule_id = s.id
       WHERE b.schedule_id = ? AND b.booking_status != 'cancelled'`,
      [scheduleId]
    )

    // Cancel all bookings
    for (const booking of bookings) {
      await execute(
        `UPDATE bookings SET booking_status = 'cancelled', payment_status = 'refunded' WHERE id = ?`,
        [booking.id]
      )

      // Free up seats
      await execute(
        `UPDATE seat_bookings SET status = 'cancelled' WHERE booking_id = ?`,
        [booking.id]
      )
    }

    // Update available seats count
    const schedule = await query(
      `SELECT * FROM schedules WHERE id = ?`,
      [scheduleId]
    )

    if (schedule.length > 0) {
      const bookedSeats = await query(
        `SELECT COUNT(*) as count FROM seat_bookings WHERE schedule_id = ? AND status = 'booked'`,
        [scheduleId]
      )

      const bookedCount = bookedSeats[0]?.count || 0
      const totalSeats = schedule[0].available_seats + bookedCount

      await execute(
        `UPDATE schedules SET available_seats = ? WHERE id = ?`,
        [totalSeats, scheduleId]
      )
    }

    const schedules = await query(`SELECT * FROM schedules WHERE id = ?`, [scheduleId])
    return { schedule: schedules[0], affectedBookings: bookings }
  },
}

// Export database instance for direct access if needed (renamed to avoid conflict)
export { database as dbInstance }
export default db

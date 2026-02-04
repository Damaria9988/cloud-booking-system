/**
 * Holiday database operations
 * Handles holiday management and pricing calculations
 */

import { query, execute } from './connection'

/**
 * Create a holiday
 */
export async function createHoliday(
  name: string,
  date: string,
  type: string = 'national',
  isRecurring: boolean = false,
  priceMultiplier: number = 1.5
) {
  const result = await execute(
    `INSERT INTO holidays (name, date, type, is_recurring, price_multiplier)
     VALUES (?, date(?), ?, ?, ?)`,
    [name, date, type, isRecurring ? 1 : 0, priceMultiplier]
  )
  const holidays = await query("SELECT * FROM holidays WHERE id = ?", [result.lastInsertRowid])
  return holidays[0]
}

/**
 * Get all holidays
 */
export async function getAllHolidays(year?: number) {
  let sql = `SELECT * FROM holidays WHERE 1=1`
  const params: any[] = []
  
  if (year) {
    sql += ` AND (strftime('%Y', date) = ? OR is_recurring = 1)`
    params.push(year.toString())
  }
  
  sql += ` ORDER BY date ASC`
  return query(sql, params)
}

/**
 * Check if a date is a holiday
 */
export async function isHoliday(date: string): Promise<{ isHoliday: boolean; holiday?: any }> {
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
}

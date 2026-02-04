/**
 * Promo code database operations
 * Handles promo code CRUD, validation, and usage tracking
 */

import { query, execute } from './connection'

/**
 * Validate a promo code
 */
export async function validatePromoCode(code: string, userType = "all") {
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
}

/**
 * Get active student promotions
 */
export async function getActiveStudentPromotions() {
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
}

/**
 * Get active first-time user promotions
 */
export async function getActiveFirstTimePromotions() {
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
}

/**
 * Increment promo code usage count by ID
 */
export async function incrementPromoCodeUsageById(promoId: number) {
  return execute(
    `UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?`,
    [promoId]
  )
}

/**
 * Get all promo codes (admin)
 */
export async function getAllPromoCodes() {
  return query(`SELECT * FROM promo_codes ORDER BY created_at DESC`)
}

/**
 * Create a new promo code
 */
export async function createPromoCode(data: {
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
}

/**
 * Update a promo code
 */
export async function updatePromoCode(promoId: number, data: {
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
}

/**
 * Toggle promo code active status
 */
export async function togglePromoCode(promoId: number) {
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
}

/**
 * Increment promo code usage by code string
 */
export async function incrementPromoCodeUsage(promoCode: string) {
  await execute(
    `UPDATE promo_codes SET used_count = used_count + 1 WHERE code = ?`,
    [promoCode]
  )
}

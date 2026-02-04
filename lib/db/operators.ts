/**
 * Operator database operations
 * Handles operator CRUD operations and management
 */

import { query, execute } from './connection'

/**
 * Get all operators
 */
export async function getAllOperators() {
  return query(`SELECT * FROM operators ORDER BY name`)
}

/**
 * Check if operator with same name exists (case-insensitive)
 */
export async function checkOperatorExists(name: string, excludeId?: number): Promise<boolean> {
  let sql = `SELECT id FROM operators WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))`
  const params: any[] = [name]
  
  if (excludeId) {
    sql += ` AND id != ?`
    params.push(excludeId)
  }
  
  const result = await query(sql, params)
  return result.length > 0
}

/**
 * Create a new operator
 */
export async function createOperator(data: {
  name: string
  email?: string
  phone?: string
}) {
  // Check for duplicate operator name
  const exists = await checkOperatorExists(data.name)
  if (exists) {
    throw new Error(`Operator with name "${data.name}" already exists`)
  }

  const result = await execute(
    `INSERT INTO operators (name, email, phone) VALUES (?, ?, ?)`,
    [data.name, data.email || null, data.phone || null]
  )
  const operators = await query("SELECT * FROM operators WHERE id = ?", [result.lastInsertRowid])
  return operators
}

/**
 * Update an operator
 */
export async function updateOperator(operatorId: number, data: {
  name?: string
  email?: string
  phone?: string
}) {
  // Check for duplicate name if name is being updated
  if (data.name) {
    const exists = await checkOperatorExists(data.name, operatorId)
    if (exists) {
      throw new Error(`Operator with name "${data.name}" already exists`)
    }
  }

  const updates: string[] = []
  const params: any[] = []

  if (data.name !== undefined) {
    updates.push(`name = ?`)
    params.push(data.name)
  }
  if (data.email !== undefined) {
    updates.push(`email = ?`)
    params.push(data.email)
  }
  if (data.phone !== undefined) {
    updates.push(`phone = ?`)
    params.push(data.phone)
  }

  if (updates.length === 0) {
    return query(`SELECT * FROM operators WHERE id = ?`, [operatorId])
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`)
  params.push(operatorId)

  await execute(
    `UPDATE operators SET ${updates.join(', ')} WHERE id = ?`,
    params
  )
  const operators = await query("SELECT * FROM operators WHERE id = ?", [operatorId])
  return operators
}

/**
 * Delete an operator (soft delete - sets inactive)
 */
export async function deleteOperator(operatorId: number) {
  // Check if operator has active routes
  const routes = await query(
    `SELECT COUNT(*) as count FROM routes WHERE operator_id = ? AND status = 'active'`,
    [operatorId]
  )

  if (routes[0]?.count > 0) {
    throw new Error('Cannot delete operator with active routes')
  }

  await execute(
    `UPDATE operators SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [operatorId]
  )
  const operators = await query("SELECT * FROM operators WHERE id = ?", [operatorId])
  return operators
}

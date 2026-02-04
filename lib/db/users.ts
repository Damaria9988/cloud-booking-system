/**
 * User database operations
 * Handles all user-related CRUD operations and email verification
 */

import { query, execute } from './connection'

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  return query("SELECT * FROM users WHERE email = ?", [email])
}

/**
 * Create a new user
 */
export async function createUser(data: {
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
}

/**
 * Create email verification token
 */
export async function createEmailVerificationToken(userId: number, token: string, expiresAt: Date) {
  return execute(
    `UPDATE users 
     SET email_verification_token = ?, 
         email_verification_expires = ?,
         updated_at = datetime('now')
     WHERE id = ?`,
    [token, expiresAt.toISOString(), userId]
  )
}

/**
 * Verify user email using token
 */
export async function verifyEmail(token: string) {
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
}

/**
 * Resend email verification (returns user for token generation)
 */
export async function resendEmailVerification(email: string) {
  const users = await getUserByEmail(email)
  if (users.length === 0) {
    return null
  }
  return users[0]
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number) {
  const users = await query("SELECT * FROM users WHERE id = ?", [userId])
  return users.length > 0 ? users[0] : null
}

/**
 * Update user password
 */
export async function updateUserPassword(userId: number, newPasswordHash: string) {
  await execute(
    `UPDATE users 
     SET password_hash = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [newPasswordHash, userId]
  )
  return true
}

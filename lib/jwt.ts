// JWT (JSON Web Token) utilities for secure session management
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me'
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production')
}
const JWT_EXPIRES_IN = '7d' // 7 days
const REFRESH_TOKEN_EXPIRES_IN = '30d' // 30 days

export interface JWTPayload {
  userId: number
  email: string
  firstName: string
  lastName: string
  isStudent: boolean
  isAdmin: boolean
  emailVerified: boolean
  iat?: number
  exp?: number
}

export interface RefreshTokenPayload {
  userId: number
  tokenVersion: number
  iat?: number
  exp?: number
}

/**
 * Generate access token (JWT)
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256',
  })
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId: number, tokenVersion: number = 0): string {
  return jwt.sign(
    { userId, tokenVersion },
    JWT_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      algorithm: 'HS256',
    }
  )
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as JWTPayload

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('JWT expired')
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('JWT invalid')
    }
    return null
  }
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as RefreshTokenPayload

    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Set JWT access token in HTTP-only cookie
 */
export async function setAccessTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  
  cookieStore.set('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

/**
 * Set JWT refresh token in HTTP-only cookie
 */
export async function setRefreshTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  
  cookieStore.set('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
}

/**
 * Get access token from cookies
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')
  return token?.value || null
}

/**
 * Get refresh token from cookies
 */
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('refreshToken')
  return token?.value || null
}

/**
 * Clear all auth tokens
 */
export async function clearAuthTokens(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('accessToken')
  cookieStore.delete('refreshToken')
  // Also clear old session cookie for backwards compatibility
  cookieStore.delete('session')
}

/**
 * Create user session (set both access and refresh tokens)
 */
export async function createUserSession(user: {
  id: number
  email: string
  firstName: string
  lastName: string
  isStudent: boolean
  isAdmin: boolean
  emailVerified: boolean
}): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isStudent: user.isStudent,
    isAdmin: user.isAdmin,
    emailVerified: user.emailVerified,
  })

  const refreshToken = generateRefreshToken(user.id)

  await setAccessTokenCookie(accessToken)
  await setRefreshTokenCookie(refreshToken)

  return { accessToken, refreshToken }
}

/**
 * Get user from JWT token
 */
export async function getUserFromToken(): Promise<JWTPayload | null> {
  const token = await getAccessToken()
  
  if (!token) {
    return null
  }

  return verifyAccessToken(token)
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken()
  
  if (!refreshToken) {
    return null
  }

  const payload = verifyRefreshToken(refreshToken)
  
  if (!payload) {
    await clearAuthTokens()
    return null
  }

  // Get user from database to ensure they still exist and get latest data
  const { db } = await import('./db')
  const user = await db.getUserById(payload.userId)

  if (!user) {
    await clearAuthTokens()
    return null
  }

  // Generate new access token
  const newAccessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    isStudent: user.is_student === 1 || user.is_student === true,
    isAdmin: user.is_admin === 1 || user.is_admin === true,
    emailVerified: user.email_verified === 1 || user.email_verified === true,
  })

  await setAccessTokenCookie(newAccessToken)

  return newAccessToken
}

/**
 * Decode token without verification (for inspection only)
 */
export function decodeToken(token: string): any {
  try {
    return jwt.decode(token)
  } catch {
    return null
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  
  if (!decoded || !decoded.exp) {
    return true
  }

  return Date.now() >= decoded.exp * 1000
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  const decoded = decodeToken(token)
  
  if (!decoded || !decoded.exp) {
    return null
  }

  return new Date(decoded.exp * 1000)
}

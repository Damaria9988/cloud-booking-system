// CSRF (Cross-Site Request Forgery) Protection
// Implements double-submit cookie pattern

import { cookies } from "next/headers"
import { randomBytes } from "crypto"

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex")
}

/**
 * Set CSRF token in cookie
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken()
  const cookieStore = await cookies()
  
  cookieStore.set("csrf-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  })
  
  return token
}

/**
 * Get CSRF token from cookies
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("csrf-token")
  return token?.value || null
}

/**
 * Verify CSRF token from request
 */
export async function verifyCsrfToken(requestToken: string): Promise<boolean> {
  const cookieToken = await getCsrfToken()
  
  if (!cookieToken || !requestToken) {
    return false
  }
  
  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(cookieToken, requestToken)
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * Middleware helper to validate CSRF token
 */
export async function validateCsrfToken(request: Request): Promise<{
  valid: boolean
  error?: string
}> {
  // Only check for state-changing methods
  const method = request.method.toUpperCase()
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return { valid: true }
  }
  
  // Get token from header
  const headerToken = request.headers.get("x-csrf-token")
  
  if (!headerToken) {
    return {
      valid: false,
      error: "CSRF token missing from request headers",
    }
  }
  
  const isValid = await verifyCsrfToken(headerToken)
  
  if (!isValid) {
    return {
      valid: false,
      error: "Invalid CSRF token",
    }
  }
  
  return { valid: true }
}

/**
 * CSRF token response helper
 */
export function csrfTokenResponse() {
  return new Response(
    JSON.stringify({
      error: "CSRF token validation failed",
      message: "Invalid or missing CSRF token. Please refresh the page and try again.",
    }),
    {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}

/**
 * Hook to get CSRF token for client-side use
 * This should be called in a server component and passed to client
 */
export async function getClientCsrfToken(): Promise<string> {
  let token = await getCsrfToken()
  
  if (!token) {
    token = await setCsrfToken()
  }
  
  return token
}

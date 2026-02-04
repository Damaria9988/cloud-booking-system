import { cookies } from "next/headers"
import type { User } from "@/lib/auth"
import { getUserFromToken, refreshAccessToken } from "@/lib/jwt"

/**
 * Get the current authenticated user from JWT token
 * Use this in Server Components and API routes
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // Try to get user from access token
    let payload = await getUserFromToken()

    // If access token is expired, try to refresh it
    if (!payload) {
      const newToken = await refreshAccessToken()
      if (newToken) {
        payload = await getUserFromToken()
      }
    }

    if (!payload) {
      // Fallback to old session cookie for backwards compatibility
      const cookieStore = await cookies()
      const sessionCookie = cookieStore.get("session")

      if (sessionCookie?.value) {
        const sessionData = JSON.parse(
          Buffer.from(sessionCookie.value, "base64").toString()
        ) as User
        return sessionData
      }

      return null
    }

    // Convert JWT payload to User type
    const user: User = {
      id: payload.userId,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      isStudent: payload.isStudent,
      isAdmin: payload.isAdmin,
    }

    return user
  } catch (error) {
    // Invalid token
    return null
  }
}

/**
 * Require authentication - throws error if user is not authenticated
 * Use this in Server Components and API routes that require auth
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

/**
 * Require admin - throws error if user is not admin
 * Use this in Server Components and API routes that require admin
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()
  if (!user.isAdmin) {
    throw new Error("Forbidden: Admin access required")
  }
  return user
}


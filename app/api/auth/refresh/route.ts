import { NextResponse } from "next/server"
import { refreshAccessToken, getUserFromToken } from "@/lib/jwt"

/**
 * Refresh JWT access token using refresh token
 * POST /api/auth/refresh
 */
export async function POST() {
  try {
    const newAccessToken = await refreshAccessToken()

    if (!newAccessToken) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      )
    }

    // Get updated user data
    const payload = await getUserFromToken()

    if (!payload) {
      return NextResponse.json(
        { error: "Failed to get user data" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Token refreshed successfully",
      user: {
        id: payload.userId,
        email: payload.email,
        isAdmin: payload.isAdmin,
        emailVerified: payload.emailVerified,
      },
    })
  } catch (error) {
    console.error("Token refresh error:", error)
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    )
  }
}

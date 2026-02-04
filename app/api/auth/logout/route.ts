import { NextResponse } from "next/server"
import { clearAuthTokens } from "@/lib/jwt"

export async function POST() {
  try {
    // Clear JWT tokens (access and refresh)
    await clearAuthTokens()

    return NextResponse.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    )
  }
}

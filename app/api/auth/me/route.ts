import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAccessToken } from "@/lib/jwt"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")

    if (!accessToken?.value) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Verify and decode JWT access token
    try {
      const userData = verifyAccessToken(accessToken.value)

      if (!userData) {
        // Invalid or expired token
        cookieStore.delete("accessToken")
        return NextResponse.json({ user: null }, { status: 200 })
      }

      // Fetch latest user data from database to ensure we have the most up-to-date information
      // This is important because JWT tokens don't update when profile is changed
      const dbUser = await db.getUserById(userData.userId)
      
      if (!dbUser) {
        cookieStore.delete("accessToken")
        return NextResponse.json({ user: null }, { status: 200 })
      }

      return NextResponse.json({ 
        user: {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.first_name,
          lastName: dbUser.last_name,
          phone: dbUser.phone || "",
          isStudent: dbUser.is_student === 1 || dbUser.is_student === true,
          isAdmin: dbUser.is_admin === 1 || dbUser.is_admin === true,
          emailVerified: dbUser.email_verified === 1 || dbUser.email_verified === true,
        }
      })
    } catch (error) {
      // Invalid token
      cookieStore.delete("accessToken")
      return NextResponse.json({ user: null }, { status: 200 })
    }
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


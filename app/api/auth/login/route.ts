import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyPassword } from "@/lib/auth"
import { createUserSession } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Get user from database
    const users = await db.getUserByEmail(email)
    if (users.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const user = users[0]

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Create JWT session (access token + refresh token)
    await createUserSession({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      isStudent: user.is_student === 1 || user.is_student === true,
      isAdmin: user.is_admin === 1 || user.is_admin === true,
      emailVerified: user.email_verified === 1 || user.email_verified === true,
    })

    // Return user data (without password)
    // SQLite stores booleans as integers (0 or 1), so convert them
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isStudent: user.is_student === 1 || user.is_student === true,
        isAdmin: user.is_admin === 1 || user.is_admin === true,
        emailVerified: user.email_verified === 1 || user.email_verified === true,
      },
    })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? error.message : undefined,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}


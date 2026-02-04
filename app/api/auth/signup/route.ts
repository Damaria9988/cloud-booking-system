import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { createUserSession } from "@/lib/jwt"
import { broadcastUserCreated } from "@/lib/websocket-broadcast"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phone, isStudent, studentId, promotionId } = body

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Email, password, first name, and last name are required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUsers = await db.getUserByEmail(email)
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const result = await db.createUser({
      email,
      passwordHash,
      firstName,
      lastName,
      phone: phone || undefined,
      isStudent: isStudent || false,
      studentId: studentId || undefined,
    })

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      )
    }

    const user = result[0]

    // Track promotion usage if promotionId is provided (for first-time user promotions)
    if (promotionId) {
      try {
        await db.incrementPromoCodeUsageById(promotionId)
      } catch (error) {
        // Log error but don't fail signup if promotion tracking fails
        console.error("Failed to track promotion usage:", error)
      }
    }

    // Broadcast new user creation via Socket.IO for real-time updates
    try {
      await broadcastUserCreated({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone || null,
        isStudent: user.is_student === 1 || user.is_student === true,
        isAdmin: user.is_admin === 1 || user.is_admin === true,
        createdAt: user.created_at,
      })
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError)
      // Don't fail signup if WebSocket fails
    }

    // Create JWT session
    await createUserSession({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      isStudent: user.is_student === 1 || user.is_student === true,
      isAdmin: user.is_admin === 1 || user.is_admin === true,
      emailVerified: false, // No email verification
    })

    // Return user data (without password)
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isStudent: user.is_student || false,
          isAdmin: user.is_admin || false,
        },
        message: "Account created successfully!",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


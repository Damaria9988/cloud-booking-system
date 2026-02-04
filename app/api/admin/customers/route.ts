import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"
import { hashPassword } from "@/lib/auth"
import { broadcastUserCreated } from "@/lib/websocket-broadcast"

// GET /api/admin/customers - Get all customers
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    // Get all users (customers) - exclude admin users
    const users = await query(
      "SELECT id, email, first_name, last_name, phone, is_student, is_admin, created_at FROM users WHERE is_admin = 0 ORDER BY created_at DESC"
    )

    return NextResponse.json({ customers: users })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Get customers error:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

// POST /api/admin/customers - Create a new user (admin can create users directly)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { email, password, firstName, lastName, phone, isStudent } = body

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
    })

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      )
    }

    const user = result[0]

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
      // Don't fail user creation if WebSocket fails
    }

    // Return user data (without password)
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          isStudent: user.is_student || false,
          isAdmin: user.is_admin || false,
        },
        message: "User created successfully. They can now login with the provided credentials.",
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Create user error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    )
  }
}

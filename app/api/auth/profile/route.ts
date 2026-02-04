import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/get-user"
import { broadcastProfileUpdated } from "@/lib/websocket-broadcast"

// GET /api/auth/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get full user data from database
    const dbUser = await db.getUserById(user.id)
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
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
      },
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

// PATCH /api/auth/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, phone } = body

    // Update user in database
    await db.execute(
      `UPDATE users 
       SET first_name = ?, last_name = ?, phone = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [firstName || null, lastName || null, phone || null, user.id]
    )

    // Get updated user data
    const updatedUser = await db.getUserById(user.id)

    const formattedUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      phone: updatedUser.phone || "",
      isStudent: updatedUser.is_student === 1 || updatedUser.is_student === true,
      isAdmin: updatedUser.is_admin === 1 || updatedUser.is_admin === true,
      emailVerified: updatedUser.email_verified === 1 || updatedUser.email_verified === true,
    }

    // Broadcast profile update via Socket.IO for instant updates
    try {
      broadcastProfileUpdated(user.id, formattedUser)
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError)
      // Don't fail the profile update if WebSocket fails
    }

    return NextResponse.json({
      user: formattedUser,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}

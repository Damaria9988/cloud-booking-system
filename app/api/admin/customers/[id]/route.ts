import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin, getCurrentUser } from "@/lib/get-user"
import { broadcastUserDeleted } from "@/lib/websocket-broadcast"

// DELETE /api/admin/customers/[id] - Delete user account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    await requireAdmin()

    // Handle both sync and async params (Next.js 13+ vs 15+)
    const resolvedParams = params instanceof Promise ? await params : params
    const idParam = resolvedParams.id
    
    if (!idParam) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    
    const userId = parseInt(idParam)
    if (isNaN(userId) || userId <= 0) {
      console.error("Invalid user ID:", idParam)
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Prevent admin from deleting themselves
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.getUserById(userId)
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Prevent deleting admin users
    if (user.is_admin === 1 || user.is_admin === true) {
      return NextResponse.json(
        { error: "Cannot delete admin accounts" },
        { status: 400 }
      )
    }

    // Check for active bookings (non-cancelled, non-completed)
    const activeBookings = await db.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE user_id = ? 
       AND booking_status NOT IN ('cancelled', 'completed')`,
      [userId]
    )

    if (activeBookings[0]?.count > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete user with active bookings. Please cancel or complete all bookings first.",
          activeBookingsCount: activeBookings[0].count
        },
        { status: 400 }
      )
    }

    // Delete user (bookings will have user_id set to NULL due to ON DELETE SET NULL)
    await db.execute(`DELETE FROM users WHERE id = ?`, [userId])

    // Broadcast user deletion to connected clients
    try {
      broadcastUserDeleted(userId)
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError)
      // Don't fail the deletion if WebSocket fails
    }

    return NextResponse.json({
      message: "User deleted successfully",
    })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}

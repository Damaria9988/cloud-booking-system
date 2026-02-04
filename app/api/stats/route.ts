import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/stats - Get public statistics (no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeUsers = searchParams.get("includeUsers") === "true"

    // Get total user count (excluding admins)
    // SQLite stores booleans as 0/1, so check for both 0 and NULL
    const userCount = await db.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM users WHERE (is_admin = 0 OR is_admin IS NULL)`
    )

    const totalUsers = userCount[0]?.count || 0

    const response: any = {
      totalUsers,
    }

    // Optionally include recent users for profile display
    if (includeUsers) {
      const recentUsers = await db.query<{
        id: number
        first_name: string
        last_name: string
        email: string
      }>(
        `SELECT id, first_name, last_name, email 
         FROM users 
         WHERE (is_admin = 0 OR is_admin IS NULL)
         ORDER BY created_at DESC 
         LIMIT 4`
      )

      response.users = recentUsers.map((user) => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        initials: `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.toUpperCase(),
      }))
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Get stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    )
  }
}

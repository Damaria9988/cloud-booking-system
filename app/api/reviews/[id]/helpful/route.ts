import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-user"
import { query, execute } from "@/lib/db"

// POST /api/reviews/[id]/helpful - Mark a review as helpful
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please login to mark reviews as helpful." },
        { status: 401 }
      )
    }

    const reviewId = parseInt(params.id)

    if (isNaN(reviewId)) {
      return NextResponse.json(
        { error: "Invalid review ID" },
        { status: 400 }
      )
    }

    // Check if review exists
    const reviews = await query(
      `SELECT id FROM reviews WHERE id = ?`,
      [reviewId]
    )

    if (reviews.length === 0) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    // Check if user has already marked this review as helpful
    const existing = await query(
      `SELECT id FROM review_helpful WHERE review_id = ? AND user_id = ?`,
      [reviewId, user.id]
    )

    if (existing.length > 0) {
      // Remove the helpful mark (toggle)
      await execute(
        `DELETE FROM review_helpful WHERE review_id = ? AND user_id = ?`,
        [reviewId, user.id]
      )

      // Decrement helpful count
      await execute(
        `UPDATE reviews
         SET helpful_count = helpful_count - 1,
             updated_at = datetime('now')
         WHERE id = ?`,
        [reviewId]
      )

      return NextResponse.json({
        message: "Review unmarked as helpful",
        helpful: false,
      })
    } else {
      // Add helpful mark
      await execute(
        `INSERT INTO review_helpful (review_id, user_id)
         VALUES (?, ?)`,
        [reviewId, user.id]
      )

      // Increment helpful count
      await execute(
        `UPDATE reviews
         SET helpful_count = helpful_count + 1,
             updated_at = datetime('now')
         WHERE id = ?`,
        [reviewId]
      )

      return NextResponse.json({
        message: "Review marked as helpful",
        helpful: true,
      })
    }
  } catch (error) {
    console.error("Mark review helpful error:", error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || "Failed to mark review as helpful" },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

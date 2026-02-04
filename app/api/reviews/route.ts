import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/get-user"
import { query, execute } from "@/lib/db"

// GET /api/reviews - Get reviews for a route or operator
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const routeId = searchParams.get("routeId")
    const operatorId = searchParams.get("operatorId")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    if (!routeId && !operatorId) {
      return NextResponse.json(
        { error: "Either routeId or operatorId is required" },
        { status: 400 }
      )
    }

    let sql = `
      SELECT 
        r.id,
        r.rating,
        r.title,
        r.comment,
        r.is_verified,
        r.helpful_count,
        r.created_at,
        u.first_name,
        u.last_name,
        u.email
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `

    const params: any[] = []

    if (routeId) {
      sql += ` AND r.route_id = ?`
      params.push(parseInt(routeId))
    }

    if (operatorId) {
      sql += ` AND r.operator_id = ?`
      params.push(parseInt(operatorId))
    }

    sql += `
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `
    params.push(limit, offset)

    const reviews = await query(sql, params)

    // Get total count
    let countSql = `
      SELECT COUNT(*) as total
      FROM reviews r
      WHERE 1=1
    `
    const countParams: any[] = []

    if (routeId) {
      countSql += ` AND r.route_id = ?`
      countParams.push(parseInt(routeId))
    }

    if (operatorId) {
      countSql += ` AND r.operator_id = ?`
      countParams.push(parseInt(operatorId))
    }

    const countResult = await query(countSql, countParams)
    const total = countResult[0]?.total || 0

    // Calculate average rating
    let avgSql = `
      SELECT AVG(rating) as average, COUNT(*) as count
      FROM reviews
      WHERE 1=1
    `
    const avgParams: any[] = []

    if (routeId) {
      avgSql += ` AND route_id = ?`
      avgParams.push(parseInt(routeId))
    }

    if (operatorId) {
      avgSql += ` AND operator_id = ?`
      avgParams.push(parseInt(operatorId))
    }

    const avgResult = await query(avgSql, avgParams)
    const averageRating = avgResult[0]?.average || 0
    const totalReviews = avgResult[0]?.count || 0

    // Format reviews
    const formattedReviews = reviews.map((review: any) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerified: review.is_verified === 1,
      helpfulCount: review.helpful_count,
      createdAt: review.created_at,
      user: {
        name: `${review.first_name} ${review.last_name}`,
        email: review.email,
      },
    }))

    return NextResponse.json({
      reviews: formattedReviews,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      stats: {
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalReviews,
      },
    })
  } catch (error) {
    console.error("Get reviews error:", error)
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please login to submit a review." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookingId, rating, title, comment } = body

    // Validate required fields
    if (!bookingId || !rating) {
      return NextResponse.json(
        { error: "Booking ID and rating are required" },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }

    // Check if booking exists and belongs to the user
    const bookings = await query(
      `SELECT 
        b.id,
        b.user_id,
        b.route_id,
        b.booking_status,
        r.operator_id
       FROM bookings b
       JOIN routes r ON b.route_id = r.id
       WHERE b.id = ?`,
      [bookingId]
    )

    if (bookings.length === 0) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    const booking = bookings[0]

    if (booking.user_id !== user.id) {
      return NextResponse.json(
        { error: "You can only review your own bookings" },
        { status: 403 }
      )
    }

    // Check if user has already reviewed this booking
    const existingReviews = await query(
      `SELECT id FROM reviews WHERE booking_id = ? AND user_id = ?`,
      [bookingId, user.id]
    )

    if (existingReviews.length > 0) {
      return NextResponse.json(
        { error: "You have already reviewed this booking" },
        { status: 409 }
      )
    }

    // Determine if the review is verified (booking was completed)
    const isVerified = booking.booking_status === "completed" ? 1 : 0

    // Create the review
    const result = await execute(
      `INSERT INTO reviews (user_id, booking_id, route_id, operator_id, rating, title, comment, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, bookingId, booking.route_id, booking.operator_id, rating, title, comment, isVerified]
    )

    // Update operator rating
    const avgRatingResult = await query(
      `SELECT AVG(rating) as average, COUNT(*) as count
       FROM reviews
       WHERE operator_id = ?`,
      [booking.operator_id]
    )

    if (avgRatingResult.length > 0) {
      const avgRating = avgRatingResult[0].average
      const reviewCount = avgRatingResult[0].count

      await execute(
        `UPDATE operators
         SET rating = ?,
             total_reviews = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
        [avgRating, reviewCount, booking.operator_id]
      )
    }

    // Fetch the created review
    const createdReviews = await query(
      `SELECT 
        r.id,
        r.rating,
        r.title,
        r.comment,
        r.is_verified,
        r.helpful_count,
        r.created_at,
        u.first_name,
        u.last_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [result.lastInsertRowid]
    )

    const createdReview = createdReviews[0]

    return NextResponse.json(
      {
        message: "Review submitted successfully",
        review: {
          id: createdReview.id,
          rating: createdReview.rating,
          title: createdReview.title,
          comment: createdReview.comment,
          isVerified: createdReview.is_verified === 1,
          helpfulCount: createdReview.helpful_count,
          createdAt: createdReview.created_at,
          user: {
            name: `${createdReview.first_name} ${createdReview.last_name}`,
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create review error:", error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || "Failed to submit review" },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred while submitting the review" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/promo-codes/student - Get active first-time user promotions for signup page
export async function GET(request: NextRequest) {
  try {
    const promotions = await db.getActiveFirstTimePromotions()
    
    // Return the first active first-time promotion (if any)
    // Only return if promotion is active (double-check even though query filters by is_active)
    if (promotions.length > 0) {
      const promo = promotions[0]
      
      // Explicitly check if promotion is active
      if (promo.is_active !== 1 && promo.is_active !== true) {
        return NextResponse.json({
          promotion: null,
        })
      }
      
      return NextResponse.json({
        promotion: {
          id: promo.id,
          discountType: promo.discount_type,
          discountValue: promo.discount_value,
          maxDiscount: promo.max_discount,
          description: `New to Damaria's Travel? Get ${promo.discount_type === 'percent' ? `${promo.discount_value}%` : `₹${promo.discount_value}`} off your first booking!`,
        },
      })
    }

    // No active first-time promotion found
    return NextResponse.json({
      promotion: null,
    })
  } catch (error) {
    console.error("Get first-time promotions error:", error)
    return NextResponse.json(
      { error: "Failed to fetch promotions" },
      { status: 500 }
    )
  }
}

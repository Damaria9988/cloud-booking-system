import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/get-user"

// POST /api/promo-codes/validate - Validate promo code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, subtotal } = body

    if (!code) {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 }
      )
    }

    // Get current user to determine user type
    const user = await getCurrentUser()
    const userType = user?.isStudent ? "student" : user ? "all" : "all"

    // Validate promo code
    const promoResult = await db.validatePromoCode(code.toUpperCase(), userType)

    if (promoResult.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired promo code" },
        { status: 404 }
      )
    }

    const promo = promoResult[0]

    // Check minimum amount if set
    if (promo.min_amount && subtotal && parseFloat(subtotal) < parseFloat(promo.min_amount)) {
      return NextResponse.json(
        { 
          error: `Minimum purchase amount of $${parseFloat(promo.min_amount).toFixed(2)} required for this promo code` 
        },
        { status: 400 }
      )
    }

    // Calculate discount
    let discountAmount = 0
    if (promo.discount_type === "percent") {
      discountAmount = (parseFloat(subtotal || "0") * parseFloat(promo.discount_value)) / 100
    } else {
      discountAmount = parseFloat(promo.discount_value)
    }

    // Apply max discount cap if set
    if (promo.max_discount) {
      discountAmount = Math.min(discountAmount, parseFloat(promo.max_discount))
    }

    return NextResponse.json({
      valid: true,
      promo: {
        code: promo.code,
        discountType: promo.discount_type,
        discountValue: parseFloat(promo.discount_value),
        discountAmount,
        maxDiscount: promo.max_discount ? parseFloat(promo.max_discount) : null,
        minAmount: promo.min_amount ? parseFloat(promo.min_amount) : null,
      },
    })
  } catch (error) {
    console.error("Validate promo code error:", error)
    return NextResponse.json(
      { error: "Failed to validate promo code" },
      { status: 500 }
    )
  }
}

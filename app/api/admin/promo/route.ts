import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"

// GET /api/admin/promo - Get all promo codes
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const promos = await db.getAllPromoCodes()
    return NextResponse.json({ promos })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Get promo codes error:", error)
    return NextResponse.json({ error: "Failed to fetch promo codes" }, { status: 500 })
  }
}

// POST /api/admin/promo - Create promo code
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const {
      code,
      discountType,
      discountValue,
      userType,
      validFrom,
      validUntil,
      usageLimit,
      minAmount,
      maxDiscount,
      isActive,
    } = body

    // Validate required fields
    if (!code || !discountType || discountValue === undefined || !validFrom || !validUntil) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate discount type
    if (!["percent", "fixed"].includes(discountType)) {
      return NextResponse.json(
        { error: "Discount type must be 'percent' or 'fixed'" },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existing = await db.query(
      `SELECT id FROM promo_codes WHERE code = ?`,
      [code]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Promo code already exists" },
        { status: 400 }
      )
    }

    const result = await db.createPromoCode({
      code,
      discountType,
      discountValue,
      userType: userType || "all",
      validFrom,
      validUntil,
      usageLimit,
      minAmount,
      maxDiscount,
      isActive: isActive !== undefined ? isActive : true,
    })

    return NextResponse.json({ promo: result[0] }, { status: 201 })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Create promo code error:", error)
    return NextResponse.json({ error: "Failed to create promo code" }, { status: 500 })
  }
}


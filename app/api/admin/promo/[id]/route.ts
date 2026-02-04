import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"

// PATCH /api/admin/promo/[id] - Update promo code
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await requireAdmin()

    // Handle both sync and async params (Next.js 13+ vs 15+)
    const resolvedParams = params instanceof Promise ? await params : params
    const idParam = resolvedParams.id
    
    if (!idParam) {
      return NextResponse.json({ error: "Promo ID is required" }, { status: 400 })
    }
    
    const promoId = parseInt(idParam)
    if (isNaN(promoId) || promoId <= 0) {
      return NextResponse.json({ error: "Invalid promo ID" }, { status: 400 })
    }

    const body = await request.json()

    // Validate discount type if provided
    if (body.discountType && !["percent", "fixed"].includes(body.discountType)) {
      return NextResponse.json(
        { error: "Discount type must be 'percent' or 'fixed'" },
        { status: 400 }
      )
    }

    // Check for duplicate promo code if code is being updated
    if (body.code) {
      const existing = await db.query(
        `SELECT id FROM promo_codes WHERE code = ? AND id != ?`,
        [body.code, promoId]
      )
      if (existing.length > 0) {
        return NextResponse.json(
          { error: "Promo code already exists" },
          { status: 400 }
        )
      }
    }

    const result = await db.updatePromoCode(promoId, body)

    if (result.length === 0) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 })
    }

    return NextResponse.json({ promo: result[0] })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Update promo code error:", error)
    return NextResponse.json({ error: "Failed to update promo code" }, { status: 500 })
  }
}

// DELETE /api/admin/promo/[id] - Delete promo code
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await requireAdmin()

    // Handle both sync and async params (Next.js 13+ vs 15+)
    const resolvedParams = params instanceof Promise ? await params : params
    const idParam = resolvedParams.id
    
    if (!idParam) {
      return NextResponse.json({ error: "Promo ID is required" }, { status: 400 })
    }
    
    const promoId = parseInt(idParam)
    if (isNaN(promoId) || promoId <= 0) {
      return NextResponse.json({ error: "Invalid promo ID" }, { status: 400 })
    }

    // Check if promo exists
    const existing = await db.query(
      `SELECT id FROM promo_codes WHERE id = ?`,
      [promoId]
    )

    if (existing.length === 0) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 })
    }

    // Check if promo has been used
    const promo = await db.query(
      `SELECT used_count FROM promo_codes WHERE id = ?`,
      [promoId]
    )

    if (promo[0]?.used_count > 0) {
      return NextResponse.json(
        { error: "Cannot delete promo code that has been used. Deactivate it instead." },
        { status: 400 }
      )
    }

    // Delete promo code
    await db.execute(`DELETE FROM promo_codes WHERE id = ?`, [promoId])

    return NextResponse.json({ message: "Promo code deleted successfully" })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Delete promo code error:", error)
    return NextResponse.json({ error: "Failed to delete promo code" }, { status: 500 })
  }
}


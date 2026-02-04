import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/get-user"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Handle both sync and async params (Next.js 13+ vs 15+)
    const resolvedParams = params instanceof Promise ? await params : params
    const idParam = resolvedParams.id
    
    if (!idParam) {
      return NextResponse.json({ error: "Promo ID is required" }, { status: 400 })
    }
    
    const promoId = parseInt(idParam)
    if (isNaN(promoId) || promoId <= 0) {
      return NextResponse.json({ error: "Invalid promo code ID" }, { status: 400 })
    }

    // Use the db.togglePromoCode method
    try {
      const result = await db.togglePromoCode(promoId)

      if (result.length === 0) {
        return NextResponse.json({ error: "Promo code not found" }, { status: 404 })
      }

      // Handle both integer and boolean values
      const isActive = result[0].is_active === 1 || result[0].is_active === true || result[0].is_active === '1'

      return NextResponse.json({ 
        message: "Promo code status updated successfully",
        promo: result[0],
        isActive: isActive
      })
    } catch (dbError: any) {
      if (dbError.message === "Promo code not found") {
        return NextResponse.json({ error: dbError.message }, { status: 404 })
      }
      throw dbError
    }
  } catch (error: any) {
    console.error("Error toggling promo code:", error)
    return NextResponse.json({ error: "Failed to update promo code" }, { status: 500 })
  }
}

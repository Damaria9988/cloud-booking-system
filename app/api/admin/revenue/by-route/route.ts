import { NextRequest, NextResponse } from "next/server"
import { RevenueCalculator } from "@/lib/services/revenue-calculator"
import { requireAdmin } from "@/lib/get-user"

// GET /api/admin/revenue/by-route - Get revenue by route
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const limit = parseInt(searchParams.get("limit") || "10")

    const revenue = await RevenueCalculator.getRevenueByRoute(
      dateFrom || undefined,
      dateTo || undefined,
      limit
    )

    return NextResponse.json({ revenue })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Get revenue by route error:", error)
    return NextResponse.json({ error: "Failed to fetch revenue by route" }, { status: 500 })
  }
}


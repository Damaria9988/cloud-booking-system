import { NextRequest, NextResponse } from "next/server"
import { RevenueCalculator } from "@/lib/services/revenue-calculator"
import { requireAdmin } from "@/lib/get-user"

// GET /api/admin/revenue/by-date - Get revenue trends over time
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const groupBy = (searchParams.get("groupBy") || "day") as "day" | "week" | "month"

    const trends = await RevenueCalculator.getRevenueTrends(
      dateFrom || undefined,
      dateTo || undefined,
      groupBy
    )

    return NextResponse.json({ revenue: trends })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Get revenue trends error:", error)
    return NextResponse.json({ error: "Failed to fetch revenue trends" }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"
import { broadcastPriceRuleCreated, broadcastPriceRuleDeleted } from "@/lib/websocket-broadcast"

// GET /api/admin/recurring-schedules/[id]/price-rules - Get price rules for a recurring schedule
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const recurringScheduleId = parseInt(params.id)
    if (isNaN(recurringScheduleId)) {
      return NextResponse.json({ error: "Invalid recurring schedule ID" }, { status: 400 })
    }

    const rules = await db.getRecurringSchedulePriceRules(recurringScheduleId)
    return NextResponse.json({ rules })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Get price rules error:", error)
    return NextResponse.json({ error: "Failed to fetch price rules" }, { status: 500 })
  }
}

// POST /api/admin/recurring-schedules/[id]/price-rules - Create price rule
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const recurringScheduleId = parseInt(params.id)
    if (isNaN(recurringScheduleId)) {
      return NextResponse.json({ error: "Invalid recurring schedule ID" }, { status: 400 })
    }

    const body = await request.json()
    const { dayOfWeek, priceMultiplier, fixedPrice } = body

    if (fixedPrice === undefined && priceMultiplier === undefined) {
      return NextResponse.json(
        { error: "Either fixedPrice or priceMultiplier must be provided" },
        { status: 400 }
      )
    }

    if (fixedPrice !== undefined && fixedPrice <= 0) {
      return NextResponse.json(
        { error: "Fixed price must be greater than 0" },
        { status: 400 }
      )
    }

    if (priceMultiplier !== undefined && priceMultiplier <= 0) {
      return NextResponse.json(
        { error: "Price multiplier must be greater than 0" },
        { status: 400 }
      )
    }

    await db.setRecurringSchedulePriceRule(
      recurringScheduleId,
      dayOfWeek || null,
      priceMultiplier,
      fixedPrice
    )

    // Get the created rule to broadcast
    const rules = await db.getRecurringSchedulePriceRules(recurringScheduleId)
    const newRule = rules[rules.length - 1] // Get the last one (newly created)

    // Broadcast to connected clients
    try {
      broadcastPriceRuleCreated(recurringScheduleId, newRule)
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError)
    }

    return NextResponse.json({ message: "Price rule created successfully", rule: newRule }, { status: 201 })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Create price rule error:", error)
    return NextResponse.json({ error: "Failed to create price rule" }, { status: 500 })
  }
}

// DELETE /api/admin/recurring-schedules/[id]/price-rules - Delete price rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get("ruleId")

    if (!ruleId) {
      return NextResponse.json(
        { error: "ruleId is required" },
        { status: 400 }
      )
    }

    const ruleIdNum = parseInt(ruleId)
    await db.deleteRecurringSchedulePriceRule(ruleIdNum)

    // Broadcast to connected clients
    try {
      broadcastPriceRuleDeleted(recurringScheduleId, ruleIdNum)
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError)
    }

    return NextResponse.json({ message: "Price rule deleted successfully" })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Delete price rule error:", error)
    return NextResponse.json({ error: "Failed to delete price rule" }, { status: 500 })
  }
}

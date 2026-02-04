import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/get-user"
import { broadcastOperatorUpdated, broadcastOperatorDeleted } from "@/lib/websocket-broadcast"

// PUT - Update operator
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await requireAdmin()

    // Handle both sync and async params (Next.js 13+ vs 15+)
    const resolvedParams = params instanceof Promise ? await params : params
    const idParam = resolvedParams.id
    
    if (!idParam) {
      return NextResponse.json({ error: "Operator ID is required" }, { status: 400 })
    }
    
    const operatorId = parseInt(idParam)
    if (isNaN(operatorId) || operatorId <= 0) {
      console.error("Invalid operator ID:", idParam)
      return NextResponse.json({ error: "Invalid operator ID" }, { status: 400 })
    }

    const body = await request.json()
    const { name, email, phone } = body

    // Validate input
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Operator name is required" },
        { status: 400 }
      )
    }

    // Check for duplicate operator name (excluding current operator)
    const operatorExists = await db.checkOperatorExists(name.trim(), operatorId)
    if (operatorExists) {
      return NextResponse.json(
        { error: `Operator with name "${name.trim()}" already exists` },
        { status: 400 }
      )
    }

    // Update operator
    await db.execute(
      `UPDATE operators 
       SET name = ?, email = ?, phone = ?
       WHERE id = ?`,
      [name.trim(), email?.trim() || null, phone?.trim() || null, operatorId]
    )

    const updatedOperator = await db.query(
      `SELECT * FROM operators WHERE id = ?`,
      [operatorId]
    )

    if (updatedOperator.length === 0) {
      return NextResponse.json(
        { error: "Operator not found" },
        { status: 404 }
      )
    }

    // Broadcast to connected clients
    broadcastOperatorUpdated(updatedOperator[0])

    return NextResponse.json({
      message: "Operator updated successfully",
      operator: updatedOperator[0],
    })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Error updating operator:", error)
    return NextResponse.json(
      { error: "Failed to update operator" },
      { status: 500 }
    )
  }
}

// DELETE - Delete operator
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
      return NextResponse.json({ error: "Operator ID is required" }, { status: 400 })
    }
    
    const operatorId = parseInt(idParam)
    if (isNaN(operatorId) || operatorId <= 0) {
      console.error("Invalid operator ID:", idParam)
      return NextResponse.json({ error: "Invalid operator ID" }, { status: 400 })
    }

    // Check if operator has associated routes
    const routes = await db.query(
      `SELECT COUNT(*) as count FROM routes WHERE operator_id = ?`,
      [operatorId]
    )

    if (routes[0].count > 0) {
      return NextResponse.json(
        { error: "Cannot delete operator with existing routes" },
        { status: 400 }
      )
    }

    // Delete operator
    await db.execute(`DELETE FROM operators WHERE id = ?`, [operatorId])

    // Broadcast to connected clients
    broadcastOperatorDeleted(operatorId)

    return NextResponse.json({
      message: "Operator deleted successfully",
    })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("Error deleting operator:", error)
    return NextResponse.json(
      { error: "Failed to delete operator" },
      { status: 500 }
    )
  }
}

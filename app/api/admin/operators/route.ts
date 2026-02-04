import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { broadcastOperatorCreated } from "@/lib/websocket-broadcast"

// GET - Fetch all operators
export async function GET() {
  try {
    const operators = await db.getAllOperators()

    return NextResponse.json({ operators })
  } catch (error: any) {
    console.error("Error fetching operators:", error)
    return NextResponse.json(
      { error: "Failed to fetch operators" },
      { status: 500 }
    )
  }
}

// POST - Create new operator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone } = body

    // Validate input
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Operator name is required" },
        { status: 400 }
      )
    }

    // Create operator using helper function (includes duplicate check)
    const result = await db.createOperator({
      name: name.trim(),
      email: email?.trim(),
      phone: phone?.trim()
    })

    const newOperator = result[0]

    // Broadcast to connected clients
    broadcastOperatorCreated(newOperator)

    return NextResponse.json(
      { 
        message: "Operator created successfully",
        operator: newOperator
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating operator:", error)
    if (error.message?.includes("already exists")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create operator" },
      { status: 500 }
    )
  }
}

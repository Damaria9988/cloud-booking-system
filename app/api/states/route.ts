import { NextRequest, NextResponse } from "next/server"
import { indianLocations } from "@/lib/data/indian-locations"

// GET /api/states?q=query
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""

    // Get unique states from locations
    const uniqueStates = Array.from(
      new Set(indianLocations.map((loc) => loc.state))
    ).sort()

    if (!query || query.length < 1) {
      // Return all states if no query
      return NextResponse.json({
        states: uniqueStates.map((state) => ({ name: state, value: state })),
      })
    }

    const queryLower = query.toLowerCase()

    // Filter states that match the query
    const matchingStates = uniqueStates
      .filter((state) => state.toLowerCase().includes(queryLower))
      .map((state) => ({ name: state, value: state }))
      .slice(0, 20) // Limit to 20 suggestions

    return NextResponse.json({ states: matchingStates })
  } catch (error) {
    console.error("State search error:", error)
    return NextResponse.json(
      { error: "Failed to search states", states: [] },
      { status: 500 }
    )
  }
}

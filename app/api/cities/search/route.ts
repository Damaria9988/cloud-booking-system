import { NextRequest, NextResponse } from "next/server"
// Try JSON-based search first, fallback to API
import { searchCities as searchCitiesJSON } from "@/lib/apis/country-state-city-json"
import { searchCities as searchCitiesAPI, type InternationalLocation } from "@/lib/apis/country-state-city"
import { searchIndianLocations } from "@/lib/data/indian-locations"
import { getCachedResults, cacheResults } from "@/lib/apis/city-search-cache"

// GET /api/cities/search?q=query
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // Check cache first (server-side caching)
    const cached = getCachedResults(query)
    if (cached) {
      return NextResponse.json({ suggestions: cached })
    }

    // Try international search first
    let suggestions: Array<{
      label: string
      value: string
      city: string
      state: string
      country?: string
      countryCode?: string
    }> = []

    try {
      let internationalResults: InternationalLocation[] = []
      
      // Try JSON-based search first (faster, no API calls)
      // Increased limit to 50 for better coverage (e.g., "Aus" should find "Austin")
      try {
        internationalResults = searchCitiesJSON(query, 50)
      } catch (error: any) {
        // If JSON file doesn't exist or has issues, fallback to API
        if (process.env.NODE_ENV === 'development') {
          console.warn('JSON location data not available, using API:', error?.message || error)
        }
        internationalResults = await searchCitiesAPI(query, 50)
      }
      
      if (internationalResults.length > 0) {
        suggestions = internationalResults.map((loc: InternationalLocation) => ({
          label: loc.city,
          value: loc.fullName, // e.g., "Des Moines, Iowa, USA"
          city: loc.city,
          state: loc.state,
          country: loc.country,
          countryCode: loc.countryCode,
        }))
      }
    } catch (error) {
      console.error("International city search error:", error)
      // Fall through to Indian locations fallback
    }

    // Also check Indian locations (even if international results exist)
    // This ensures Indian states like "Gujarat" are found
    try {
      const indianLocations = searchIndianLocations(query, 50)
      const indianSuggestions = indianLocations.map((loc) => ({
        label: loc.name,
        value: loc.detailedName, // e.g., "Mumbai, Maharashtra"
        city: loc.name,
        state: loc.state,
        country: "India",
        countryCode: "IN",
      }))
      
      // Merge Indian results with international results (avoid duplicates)
      const seen = new Set<string>()
      suggestions.forEach(s => seen.add(s.value.toLowerCase()))
      
      indianSuggestions.forEach(indian => {
        if (!seen.has(indian.value.toLowerCase())) {
          suggestions.push(indian)
          seen.add(indian.value.toLowerCase())
        }
      })
    } catch (error) {
      console.error("Indian locations search error:", error)
    }

    // Cache the results
    if (suggestions.length > 0) {
      cacheResults(query, suggestions)
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("City search error:", error)
    return NextResponse.json(
      { error: "Failed to search cities", suggestions: [] },
      { status: 500 }
    )
  }
}

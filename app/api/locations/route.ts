import { NextRequest, NextResponse } from 'next/server'
// Try JSON-based search first, fallback to API
import { searchCities as searchCitiesJSON } from '@/lib/apis/country-state-city-json'
import { searchCities as searchCitiesAPI, type InternationalLocation } from '@/lib/apis/country-state-city'
import { searchIndianLocations } from '@/lib/data/indian-locations'
import { getCachedResults, cacheResults } from '@/lib/apis/city-search-cache'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ locations: [] })
    }

    // Check cache first (server-side caching)
    const cached = getCachedResults(query)
    if (cached) {
      // Convert cached suggestions to locations format
      // Include index to ensure unique keys
      const locations = cached.map((suggestion: any, index: number) => {
        const cityKey = suggestion.city.toLowerCase().replace(/[^a-z0-9]/g, '-')
        const stateKey = (suggestion.state || '').toLowerCase().replace(/[^a-z0-9]/g, '-')
        const baseId = `${suggestion.countryCode || 'IN'}-${cityKey}-${stateKey}`
        return {
          iataCode: `${baseId}-${index}`, // Always include index for uniqueness
          name: suggestion.city,
          detailedName: suggestion.value || `${suggestion.city}, ${suggestion.state}${suggestion.country ? `, ${suggestion.country}` : ''}`,
          type: 'CITY',
          subType: 'CITY',
        }
      })
      return NextResponse.json({ locations })
    }

    let locations: Array<{
      iataCode: string
      name: string
      detailedName: string
      type: string
      subType: string
    }> = []

    // Try international search first (JSON-based, fallback to API)
    try {
      let internationalResults: InternationalLocation[] = []
      
      // Try JSON-based search first (faster, no API calls)
      // Increased limit to 50 for better coverage (e.g., "Raj" should find "Rajkot")
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
        // Use a Set to track seen locations and ensure uniqueness
        const seenLocations = new Set<string>()
        
        locations = internationalResults.map((loc: InternationalLocation, index: number) => {
          // Create a unique identifier by combining city, state, and country
          // Normalize to avoid duplicates (remove spaces, special chars for key)
          const cityKey = loc.city.toLowerCase().replace(/[^a-z0-9]/g, '-')
          const stateKey = (loc.stateCode || loc.state || '').toLowerCase().replace(/[^a-z0-9]/g, '-')
          let baseId = `${loc.countryCode}-${cityKey}-${stateKey}`
          
          // Always include index to ensure uniqueness, even for first occurrence
          // This prevents duplicate keys when multiple cities have same name/state/country
          const uniqueId = `${baseId}-${index}`
          
          // Track base IDs to detect actual duplicates (for logging/debugging)
          if (seenLocations.has(baseId)) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Duplicate location detected: ${baseId} (using index ${index} to make unique)`)
            }
          }
          seenLocations.add(baseId)
          
          return {
            iataCode: uniqueId, // Unique identifier for React keys (always includes index)
            name: loc.city,
            detailedName: loc.fullName, // e.g., "Des Moines, Iowa, USA"
            type: 'CITY',
            subType: 'CITY',
          }
        })
      } else {
        // Log when no results found (for debugging)
        if (process.env.NODE_ENV === 'development') {
          console.log(`No international results found for query: "${query}"`)
        }
      }
    } catch (error) {
      console.error('International location search error:', error)
      // Fall through to Indian locations fallback
    }

    // Fallback to Indian locations if no international results or API unavailable
    if (locations.length === 0) {
      try {
        const indianLocations = searchIndianLocations(query, 50)
        // Include index to ensure unique keys (in case codes are duplicated)
        locations = indianLocations.map((loc, index) => ({
          iataCode: `${loc.code}-${index}`, // Include index to ensure uniqueness
          name: loc.name,
          detailedName: loc.detailedName,
          type: loc.type,
          subType: loc.type,
        }))
      } catch (error) {
        console.error('Indian locations fallback error:', error)
      }
    }

    // Cache the results (convert to suggestions format for cache)
    if (locations.length > 0) {
      const suggestions = locations.map((loc) => ({
        label: loc.name,
        value: loc.detailedName,
        city: loc.name,
        state: loc.detailedName.split(',')[1]?.trim() || '',
        country: loc.detailedName.split(',')[2]?.trim() || 'India',
        countryCode: 'IN',
      }))
      cacheResults(query, suggestions)
    }

    return NextResponse.json({ locations })
  } catch (error: any) {
    console.error('Location search API error:', error)
    return NextResponse.json(
      { error: 'Failed to search locations', locations: [] },
      { status: 500 },
    )
  }
}


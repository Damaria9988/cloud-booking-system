/**
 * Indian cities and airports database
 * Provides autocomplete for From/To inputs without external API dependency
 */

import locationsData from './indian-locations.json'

export interface IndianLocation {
  code: string
  name: string
  state: string
  type: 'AIRPORT' | 'CITY' | 'STATION'
  detailedName: string
}

export const indianLocations: IndianLocation[] = locationsData as IndianLocation[]

/**
 * Search Indian locations by query
 * Searches by city name, state, or code
 * When state name matches, returns ALL cities from that state
 */
export function searchIndianLocations(query: string, limit: number = 10): IndianLocation[] {
  if (!query || query.length < 2) {
    return []
  }

  const queryLower = query.toLowerCase().trim()

  // First, check if query matches any state name
  const matchingStates = new Set<string>()
  indianLocations.forEach(location => {
    if (location.state.toLowerCase() === queryLower ||
        location.state.toLowerCase().startsWith(queryLower) ||
        location.state.toLowerCase().includes(queryLower)) {
      matchingStates.add(location.state)
    }
  })

  // If state matches, return ALL cities from matching states
  if (matchingStates.size > 0) {
    const stateResults: IndianLocation[] = []
    matchingStates.forEach(stateName => {
      const citiesInState = indianLocations.filter(loc => 
        loc.state.toLowerCase() === stateName.toLowerCase()
      )
      stateResults.push(...citiesInState)
    })
    
    // Sort by relevance
    const sorted = stateResults.sort((a, b) => {
      const aNameLower = a.name.toLowerCase()
      const bNameLower = b.name.toLowerCase()
      return aNameLower.localeCompare(bNameLower)
    })
    
    return sorted.slice(0, limit)
  }

  // Otherwise, search normally by city name, state, or code
  const results = indianLocations.filter((location) => {
    const nameMatch = location.name.toLowerCase().includes(queryLower)
    const stateMatch = location.state.toLowerCase().includes(queryLower)
    const codeMatch = location.code.toLowerCase().includes(queryLower)
    const detailedMatch = location.detailedName.toLowerCase().includes(queryLower)

    return nameMatch || stateMatch || codeMatch || detailedMatch
  })

  // Sort by relevance (exact matches first, then by name)
  const sorted = results.sort((a, b) => {
    const aNameLower = a.name.toLowerCase()
    const bNameLower = b.name.toLowerCase()

    // Exact name match gets priority
    if (aNameLower === queryLower) return -1
    if (bNameLower === queryLower) return 1

    // Starts with query gets priority
    if (aNameLower.startsWith(queryLower) && !bNameLower.startsWith(queryLower)) return -1
    if (bNameLower.startsWith(queryLower) && !aNameLower.startsWith(queryLower)) return 1

    // State match gets priority over city match
    const aStateMatch = a.state.toLowerCase().includes(queryLower)
    const bStateMatch = b.state.toLowerCase().includes(queryLower)
    if (aStateMatch && !bStateMatch) return -1
    if (bStateMatch && !aStateMatch) return 1

    // Then by name
    return aNameLower.localeCompare(bNameLower)
  })

  return sorted.slice(0, limit)
}

/**
 * Get location by code
 */
export function getLocationByCode(code: string): IndianLocation | undefined {
  return indianLocations.find((loc) => loc.code.toLowerCase() === code.toLowerCase())
}

/**
 * Format location for display
 */
export function formatLocation(location: IndianLocation): string {
  return location.detailedName || `${location.name}, ${location.state}`
}

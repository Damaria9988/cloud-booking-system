/**
 * Country State City API Integration
 * Provides international city/state/country search functionality
 * API: https://api.countrystatecity.in
 * 
 * Note: This API requires searching by country. For better performance,
 * we search in major countries and cache results.
 */

interface CityResponse {
  id: number | string
  name: string
  state_code?: string
  country_code?: string
}

interface CountryResponse {
  id: number
  name: string
  iso2: string
  iso3: string
}

interface StateResponse {
  id: number
  name: string
  country_code: string
  state_code: string
}

export interface InternationalLocation {
  city: string
  state: string
  country: string
  countryCode: string
  stateCode?: string
  fullName: string // e.g., "Des Moines, Iowa, USA"
}

// Simple in-memory cache to reduce API calls
const searchCache = new Map<string, { data: InternationalLocation[]; timestamp: number }>()
const countryCitiesCache = new Map<string, { data: CityResponse[]; timestamp: number }>()
const countryNameCache = new Map<string, string>()
const stateNameCache = new Map<string, string>()

const CACHE_TTL = 1000 * 60 * 60 // 1 hour cache for searches
const COUNTRY_CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours for country city lists
const MAX_CACHE_SIZE = 500

/**
 * Get API key from environment variables
 */
function getApiKey(): string | null {
  return process.env.COUNTRY_STATE_CITY_API_KEY || null
}

/**
 * Clear old cache entries if cache is too large
 */
function cleanCache() {
  if (searchCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(searchCache.entries())
    const toRemove = Math.floor(MAX_CACHE_SIZE * 0.2)
    entries
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, toRemove)
      .forEach(([key]) => searchCache.delete(key))
  }
}

/**
 * Search for cities worldwide by query string
 * Uses a smart approach: searches in major countries in parallel
 */
export async function searchCities(query: string, limit: number = 10): Promise<InternationalLocation[]> {
  try {
    // Validate input
    if (!query || query.trim().length < 2) {
      return []
    }

    const normalizedQuery = query.trim().toLowerCase()
    const cacheKey = `search:${normalizedQuery}:${limit}`

    // Check cache
    const cached = searchCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }

    const apiKey = getApiKey()

    // If no API key, return empty (with warning in development)
    if (!apiKey) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('COUNTRY_STATE_CITY_API_KEY not set. Get a free key at https://countrystatecity.in')
      }
      return []
    }

    // List of major countries to search (no prioritization - search all equally)
    const majorCountries = [
      'US', 'FR', 'GB', 'DE', 'IT', 'ES', 'IN', 'CA', 'AU', 'BR',
      'MX', 'JP', 'CN', 'KR', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO',
      'DK', 'FI', 'PL', 'PT', 'GR', 'IE', 'NZ', 'ZA', 'AR', 'CL',
      'CO', 'PE', 'VE', 'EC', 'UY', 'PY', 'BO', 'CR', 'PA', 'GT',
      'RU', 'TR', 'EG', 'SA', 'AE', 'IL', 'TH', 'VN', 'ID', 'PH'
    ]

    // Search in countries in parallel (but limit concurrency)
    const results: InternationalLocation[] = []
    const seen = new Set<string>()

    // Search all countries in batches - collect from ALL countries first, then sort
    const batchSize = 5 // Search 5 countries at a time
    const allBatchResults: InternationalLocation[] = []
    
    // Search ALL batches first (don't stop early)
    for (let i = 0; i < majorCountries.length; i += batchSize) {
      const batch = majorCountries.slice(i, i + batchSize)
      
      try {
        const batchResults = await Promise.allSettled(
          batch.map(countryCode => searchCitiesInCountry(countryCode, query, apiKey))
        )

        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            // Collect ALL results from all countries, not just up to limit
            for (const city of result.value) {
              const key = `${city.city.toLowerCase()}-${city.state.toLowerCase()}-${city.countryCode.toLowerCase()}`
              if (!seen.has(key)) {
                seen.add(key)
                allBatchResults.push(city)
              }
            }
          } else {
            // Log errors for debugging
            if (process.env.NODE_ENV === 'development') {
              console.error('Country search error:', result.reason)
            }
          }
        }
      } catch (error) {
        console.error('Batch search error:', error)
        // Continue with next batch
      }
    }
    
    // Now sort ALL collected results and take the top matches
    // This ensures we get the best matches from ALL countries, not just first batch
    allBatchResults.sort((a, b) => {
      const queryLower = normalizedQuery
      const aCityLower = a.city.toLowerCase()
      const bCityLower = b.city.toLowerCase()
      
      // Exact city name match gets highest priority
      if (aCityLower === queryLower && bCityLower !== queryLower) return -1
      if (bCityLower === queryLower && aCityLower !== queryLower) return 1
      
      // Starts with query gets next priority
      if (aCityLower.startsWith(queryLower) && !bCityLower.startsWith(queryLower)) return -1
      if (bCityLower.startsWith(queryLower) && !aCityLower.startsWith(queryLower)) return 1
      
      // Then by city name length (shorter names often more relevant)
      if (aCityLower.length !== bCityLower.length) {
        return aCityLower.length - bCityLower.length
      }
      
      // Finally, alphabetical order
      return a.city.localeCompare(b.city)
    })
    
    // Add sorted results (already sorted above)
    results.push(...allBatchResults)

    // Take top results after sorting all countries
    const finalResults = results.slice(0, limit)

    // Cache results
    cleanCache()
    searchCache.set(cacheKey, { data: finalResults, timestamp: Date.now() })

    return finalResults
  } catch (error) {
    console.error('Error in searchCities:', error)
    return []
  }
}

/**
 * Search for cities within a specific country
 */
async function searchCitiesInCountry(
  countryCode: string,
  query: string,
  apiKey: string
): Promise<InternationalLocation[]> {
  try {
    const baseUrl = 'https://api.countrystatecity.in/v1'
    const headers: HeadersInit = {
      'X-CSCAPI-KEY': apiKey,
    }

    // Get all cities in the country (cached)
    const cacheKey = `country-cities:${countryCode}`
    let allCities: CityResponse[] = []

    const cached = countryCitiesCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < COUNTRY_CACHE_TTL) {
      allCities = cached.data
      if (process.env.NODE_ENV === 'development') {
        console.log(`Using cached cities for ${countryCode} (${allCities.length} cities)`)
      }
    } else {
      try {
        const url = `${baseUrl}/countries/${countryCode}/cities`
        if (process.env.NODE_ENV === 'development') {
          console.log(`Fetching cities for ${countryCode} from: ${url}`)
        }
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // Increased to 10 seconds
        
        const response = await fetch(url, {
          headers,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          if (response.status === 401 || response.status === 403) {
            console.error(`API Authentication failed for country ${countryCode}. Check your API key. Status: ${response.status}, Response: ${errorText}`)
            return []
          }
          if (response.status === 429) {
            console.warn(`Rate limit hit for country ${countryCode}`)
            return []
          }
          if (response.status === 404) {
            // Country not found - cache empty result
            countryCitiesCache.set(cacheKey, { data: [], timestamp: Date.now() })
            return []
          }
          console.error(`API error for country ${countryCode}: ${response.status} - ${errorText}`)
          return []
        }

        allCities = await response.json()
        
        // Log sample to see what fields are available
        if (process.env.NODE_ENV === 'development' && allCities.length > 0) {
          console.log(`Sample city structure for ${countryCode}:`, JSON.stringify(allCities[0], null, 2))
        }
        
        // Add country_code to each city since API doesn't include it
        allCities = allCities.map((city: any) => ({
          ...city,
          country_code: countryCode,
        }))
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Fetched ${allCities.length} cities for ${countryCode}`)
        }
        
        // Cache all cities for this country
        countryCitiesCache.set(cacheKey, { data: allCities, timestamp: Date.now() })
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          console.error(`Timeout fetching cities for country ${countryCode} (10s timeout)`)
        } else {
          console.error(`Error fetching cities for country ${countryCode}:`, fetchError.message || fetchError)
        }
        return []
      }
    }

    // Filter cities by query - improved matching to avoid false positives
    const queryLower = query.toLowerCase().trim()
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0)
    
    const matchingCities = allCities.filter((city: any) => {
      const cityName = city.name?.toLowerCase() || ''
      // Note: cities from /countries/{code}/cities endpoint don't include state_code
      // We'll need to fetch states separately and match them
      const stateCode = (city.state_code || (city as any).stateCode || (city as any).state?.code)?.toLowerCase() || ''
      
      // Exact match gets highest priority
      if (cityName === queryLower) return true
      
      // City name starts with query (as whole word)
      if (cityName.startsWith(queryLower + ' ') || cityName.startsWith(queryLower + ',')) return true
      if (cityName === queryLower) return true
      
      // Check if query appears as a complete word (not substring like "paris" in "parish")
      // Use word boundaries to avoid partial matches
      const wordBoundaryRegex = new RegExp(`\\b${queryLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      if (wordBoundaryRegex.test(cityName)) return true
      
      // Check if any query word matches as a whole word in city name
      const cityWords = cityName.split(/[\s,]+/)
      const hasWholeWordMatch = queryWords.some((qw: string) => 
        cityWords.some((cw: string) => {
          // Exact word match
          if (cw === qw) return true
          // Word starts with query word (but query must be at least 3 chars to avoid too many matches)
          if (qw.length >= 3 && cw.startsWith(qw)) return true
          return false
        })
      )
      
      if (hasWholeWordMatch) return true
      
      // Also check state code if available
      if (stateCode && wordBoundaryRegex.test(stateCode)) return true
      
      return false
    })

    if (process.env.NODE_ENV === 'development' && matchingCities.length > 0) {
      console.log(`Found ${matchingCities.length} matching cities in ${countryCode} for "${query}"`)
      console.log(`Sample matches:`, matchingCities.slice(0, 3).map((c: any) => c.name))
    }

    // Get country name (cached)
    const countryName = await getCountryName(countryCode, apiKey)
    
    // Fetch all states for this country to get state names
    // Cache states per country to avoid repeated API calls
    const statesCacheKey = `country-states:${countryCode}`
    let statesMap = new Map<string, string>() // state_code -> state_name
    
    // Check cache first
    const cachedStates = stateNameCache.get(statesCacheKey)
    if (cachedStates) {
      // If we have cached states, use them
      const states = cachedStates as any
      if (Array.isArray(states)) {
        states.forEach((state: any) => {
          if (state.state_code && state.name) {
            statesMap.set(state.state_code.toLowerCase(), state.name)
          }
        })
      }
    } else {
      // Fetch states from API
      try {
        const statesResponse = await fetch(`${baseUrl}/countries/${countryCode}/states`, {
          headers,
          signal: AbortSignal.timeout(5000),
        })
        
        if (statesResponse.ok) {
          const states: StateResponse[] = await statesResponse.json()
          states.forEach((state) => {
            statesMap.set(state.state_code.toLowerCase(), state.name)
          })
          // Cache states for this country
          stateNameCache.set(statesCacheKey, states as any)
        }
      } catch (error) {
        // If states fetch fails, continue without state names
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Could not fetch states for ${countryCode}:`, error)
        }
      }
    }
    
    // Match cities to their states
    // Since cities from /countries/{code}/cities don't include state_code,
    // we need to search through states to find which state each city belongs to
    const cityToStateMap = new Map<string, { stateCode: string; stateName: string }>()
    
    // Get states list for searching
    let statesList: StateResponse[] = []
    if (cachedStates && Array.isArray(cachedStates)) {
      statesList = cachedStates as StateResponse[]
    } else {
      // If we don't have cached states, we already fetched them above
      // But we need to store them in a variable we can use
      // Re-fetch if needed (should be cached now)
      if (statesMap.size === 0) {
        // States weren't fetched, try again
        try {
          const statesResponse = await fetch(`${baseUrl}/countries/${countryCode}/states`, {
            headers,
            signal: AbortSignal.timeout(5000),
          })
          
          if (statesResponse.ok) {
            statesList = await statesResponse.json()
            stateNameCache.set(statesCacheKey, statesList as any)
            statesList.forEach((state) => {
              statesMap.set(state.state_code.toLowerCase(), state.name)
            })
          }
        } catch (error) {
          // Continue without states
        }
      } else {
        // We have states in the map but need the full list
        // This shouldn't happen if we cached properly, but handle it
        statesList = Array.from(statesMap.entries()).map(([code, name]) => ({
          id: 0,
          name,
          country_code: countryCode,
          state_code: code.toUpperCase(),
        }))
      }
    }
    
    // For top matching cities, find their states by searching through states
    // Limit to first 5 cities to avoid too many API calls
    const citiesToProcess = matchingCities.slice(0, 5)
    const cityNameLower = new Set(citiesToProcess.map(c => c.name.toLowerCase()))
    
    // Search through states (limit to first 30 states for performance)
    for (const state of statesList.slice(0, 30)) {
      try {
        const stateCitiesResponse = await fetch(
          `${baseUrl}/countries/${countryCode}/states/${state.state_code}/cities`,
          {
            headers,
            signal: AbortSignal.timeout(3000),
          }
        )
        
        if (stateCitiesResponse.ok) {
          const stateCities: any[] = await stateCitiesResponse.json()
          // Check if any of our matching cities are in this state
          for (const stateCity of stateCities) {
            const stateCityName = stateCity.name?.toLowerCase()
            if (stateCityName && cityNameLower.has(stateCityName)) {
              // Find the original city name (preserve case)
              const originalCity = citiesToProcess.find(c => c.name.toLowerCase() === stateCityName)
              if (originalCity && !cityToStateMap.has(originalCity.name)) {
                cityToStateMap.set(originalCity.name, {
                  stateCode: state.state_code,
                  stateName: state.name,
                })
              }
            }
          }
        }
      } catch (error) {
        // Continue to next state if this one fails
        continue
      }
    }
    
    // Format results (limit to 20 per country to avoid too many API calls)
    const results: InternationalLocation[] = []
    for (const city of matchingCities.slice(0, 20)) {
      // Try to get state information from the map
      const stateInfo = cityToStateMap.get(city.name)
      const stateName = stateInfo?.stateName || null
      const stateCode = stateInfo?.stateCode || city.state_code || (city as any).stateCode || undefined
      
      // If we have state information, use it; otherwise use country name as fallback
      const stateDisplay = stateName || stateCode || countryName || countryCode
      
      // Format full name with state if available
      const fullName = (stateName || stateCode)
        ? `${city.name}, ${stateDisplay}, ${countryName || countryCode}`
        : `${city.name}, ${countryName || countryCode}`
      
      results.push({
        city: city.name,
        state: stateDisplay,
        country: countryName || countryCode,
        countryCode: countryCode,
        stateCode: stateCode,
        fullName: fullName,
      })
    }

    if (process.env.NODE_ENV === 'development' && results.length > 0) {
      console.log(`Formatted ${results.length} results for ${countryCode}`)
    }

    return results
  } catch (error) {
    console.error(`Error searching cities in country ${countryCode}:`, error)
    return []
  }
}

/**
 * Get country name by code (with caching)
 */
async function getCountryName(countryCode: string, apiKey: string): Promise<string | null> {
  if (countryNameCache.has(countryCode)) {
    return countryNameCache.get(countryCode) || null
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    const response = await fetch(`https://api.countrystatecity.in/v1/countries/${countryCode}`, {
      headers: {
        'X-CSCAPI-KEY': apiKey,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const country: CountryResponse = await response.json()
      countryNameCache.set(countryCode, country.name)
      return country.name
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.error(`Error fetching country ${countryCode}:`, error)
    }
  }

  return null
}

/**
 * Get state name by code (with caching)
 */
async function getStateName(countryCode: string, stateCode: string, apiKey: string): Promise<string | null> {
  const cacheKey = `${countryCode}-${stateCode}`
  if (stateNameCache.has(cacheKey)) {
    return stateNameCache.get(cacheKey) || null
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    const response = await fetch(
      `https://api.countrystatecity.in/v1/countries/${countryCode}/states/${stateCode}`,
      {
        headers: {
          'X-CSCAPI-KEY': apiKey,
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (response.ok) {
      const state: StateResponse = await response.json()
      stateNameCache.set(cacheKey, state.name)
      return state.name
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.error(`Error fetching state ${countryCode}/${stateCode}:`, error)
    }
  }

  return null
}

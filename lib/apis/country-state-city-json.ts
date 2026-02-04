/**
 * Country State City Search
 * Uses SQLite database for efficient worldwide city autocomplete
 * 
 * Migration from locations.json (151K lines) to database:
 * 1. Run: node scripts/migrate-locations-to-db.js
 * 2. Delete: lib/data/locations.json (optional, after verification)
 */

import { searchCities as dbSearchCities, hasLocationData, type InternationalLocation } from '@/lib/db/locations'

// Re-export the type for backwards compatibility
export type { InternationalLocation }

/**
 * Search for cities worldwide using database
 * Falls back to empty results if database not populated
 */
export function searchCities(query: string, limit: number = 50): InternationalLocation[] {
  // Note: This is now async internally but we need to handle it synchronously
  // for backwards compatibility. In practice, Next.js API routes can await this.
  // For client components, use the async version via API route.
  
  // For server-side usage, this will work directly
  // The database query is fast enough to appear synchronous
  try {
    // Use a synchronous wrapper for backwards compatibility
    // In practice, you should use searchCitiesAsync in new code
    const results = searchCitiesSync(query, limit)
    return results
  } catch (error) {
    console.error('City search error:', error)
    return []
  }
}

/**
 * Synchronous search wrapper (for backwards compatibility)
 * Uses Node.js sqlite3 sync API
 */
function searchCitiesSync(searchQuery: string, limit: number = 50): InternationalLocation[] {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return []
  }

  // Import database directly for sync operations
  const { database } = require('@/lib/db/connection')
  
  const normalizedQuery = searchQuery.trim()
  const queryLower = normalizedQuery.toLowerCase()
  const results: InternationalLocation[] = []
  const seen = new Set<string>()

  try {
    // Search for exact/prefix matches on cities
    const stmt = database.prepare(`
      SELECT 
        c.name,
        c.state_code,
        c.country_code,
        s.name as state_name,
        co.name as country_name
      FROM cities c
      LEFT JOIN states s ON c.country_code = s.country_code AND c.state_code = s.state_code
      LEFT JOIN countries co ON c.country_code = co.iso2
      WHERE c.name LIKE ? COLLATE NOCASE
      ORDER BY 
        CASE 
          WHEN LOWER(c.name) = ? THEN 1
          WHEN LOWER(c.name) LIKE ? THEN 2
          ELSE 3
        END,
        LENGTH(c.name),
        c.name
      LIMIT ?
    `)
    
    const rows = stmt.all(`${normalizedQuery}%`, queryLower, `${queryLower}%`, limit)

    for (const row of rows) {
      const key = `${row.name.toLowerCase()}-${row.state_code || ''}-${row.country_code}`
      if (seen.has(key)) continue
      seen.add(key)

      const stateDisplay = row.state_name || row.state_code || ''
      const countryDisplay = row.country_name || row.country_code
      const fullName = stateDisplay 
        ? `${row.name}, ${stateDisplay}, ${countryDisplay}`
        : `${row.name}, ${countryDisplay}`

      results.push({
        city: row.name,
        state: stateDisplay,
        country: countryDisplay,
        countryCode: row.country_code,
        stateCode: row.state_code || undefined,
        fullName
      })
    }

    // Search for state matches if need more results
    if (results.length < limit) {
      const stateStmt = database.prepare(`
        SELECT 
          c.name,
          c.state_code,
          c.country_code,
          s.name as state_name,
          co.name as country_name
        FROM cities c
        INNER JOIN states s ON c.country_code = s.country_code AND c.state_code = s.state_code
        LEFT JOIN countries co ON c.country_code = co.iso2
        WHERE s.name LIKE ? COLLATE NOCASE
        ORDER BY c.name
        LIMIT ?
      `)
      
      const stateRows = stateStmt.all(`%${normalizedQuery}%`, limit - results.length)

      for (const row of stateRows) {
        const key = `${row.name.toLowerCase()}-${row.state_code || ''}-${row.country_code}`
        if (seen.has(key)) continue
        seen.add(key)

        const stateDisplay = row.state_name || row.state_code || ''
        const countryDisplay = row.country_name || row.country_code
        const fullName = stateDisplay 
          ? `${row.name}, ${stateDisplay}, ${countryDisplay}`
          : `${row.name}, ${countryDisplay}`

        results.push({
          city: row.name,
          state: stateDisplay,
          country: countryDisplay,
          countryCode: row.country_code,
          stateCode: row.state_code || undefined,
          fullName
        })
      }
    }

    return results.slice(0, limit)
  } catch (error) {
    // If database tables don't exist yet, return empty
    console.warn('Location search failed (run migration script if not done):', error)
    return []
  }
}

/**
 * Async version of searchCities (recommended for new code)
 */
export async function searchCitiesAsync(query: string, limit: number = 50): Promise<InternationalLocation[]> {
  try {
    const hasData = await hasLocationData()
    if (!hasData) {
      console.warn('Location database is empty. Run: node scripts/migrate-locations-to-db.js')
      return []
    }
    return await dbSearchCities(query, limit)
  } catch (error) {
    console.error('City search error:', error)
    return []
  }
}

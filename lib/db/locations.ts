/**
 * Location database operations
 * Database-backed city search for worldwide autocomplete
 * Replaces the 151K-line locations.json with efficient SQL queries
 */

import { query } from './connection'

export interface InternationalLocation {
  city: string
  state: string
  country: string
  countryCode: string
  stateCode?: string
  fullName: string
}

interface CityRow {
  name: string
  state_code: string | null
  country_code: string
  state_name: string | null
  country_name: string
}

/**
 * Search for cities worldwide using database
 * Uses indexed queries for fast autocomplete
 */
export async function searchCities(searchQuery: string, limit: number = 50): Promise<InternationalLocation[]> {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return []
  }

  const normalizedQuery = searchQuery.trim()
  const queryLower = normalizedQuery.toLowerCase()
  const results: InternationalLocation[] = []
  const seen = new Set<string>()

  // Search for exact/prefix matches on cities (highest priority)
  const exactMatches = await query<CityRow>(`
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
  `, [`${normalizedQuery}%`, queryLower, `${queryLower}%`, limit])

  for (const row of exactMatches) {
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

  // If we have enough results, return early
  if (results.length >= limit) {
    return results.slice(0, limit)
  }

  // Search for state name matches (return all cities in matching state)
  const stateMatches = await query<CityRow>(`
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
  `, [`%${normalizedQuery}%`, limit - results.length])

  for (const row of stateMatches) {
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

  // Search for country name matches (return popular cities from that country)
  if (results.length < limit) {
    const countryMatches = await query<CityRow>(`
      SELECT 
        c.name,
        c.state_code,
        c.country_code,
        s.name as state_name,
        co.name as country_name
      FROM cities c
      LEFT JOIN states s ON c.country_code = s.country_code AND c.state_code = s.state_code
      INNER JOIN countries co ON c.country_code = co.iso2
      WHERE co.name LIKE ? COLLATE NOCASE
      ORDER BY c.name
      LIMIT ?
    `, [`${normalizedQuery}%`, limit - results.length])

    for (const row of countryMatches) {
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

  // If still need more, search for contains matches on city names
  if (results.length < limit) {
    const containsMatches = await query<CityRow>(`
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
        AND c.name NOT LIKE ? COLLATE NOCASE
      ORDER BY LENGTH(c.name), c.name
      LIMIT ?
    `, [`%${normalizedQuery}%`, `${normalizedQuery}%`, limit - results.length])

    for (const row of containsMatches) {
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
}

/**
 * Get all countries
 */
export async function getCountries() {
  return query(`
    SELECT id, name, iso2, iso3, emoji
    FROM countries
    ORDER BY name
  `)
}

/**
 * Get states by country code
 */
export async function getStatesByCountry(countryCode: string) {
  return query(`
    SELECT id, name, state_code, country_code
    FROM states
    WHERE country_code = ?
    ORDER BY name
  `, [countryCode])
}

/**
 * Get cities by state
 */
export async function getCitiesByState(countryCode: string, stateCode: string) {
  return query(`
    SELECT id, name, state_code, country_code, latitude, longitude
    FROM cities
    WHERE country_code = ? AND state_code = ?
    ORDER BY name
  `, [countryCode, stateCode])
}

/**
 * Check if location tables have data
 */
export async function hasLocationData(): Promise<boolean> {
  const result = await query<{ count: number }>(`
    SELECT COUNT(*) as count FROM countries
  `)
  return (result[0]?.count || 0) > 0
}

/**
 * Script to fetch all countries, states, and cities from Country State City API
 * and store them in a JSON file for offline use.
 * 
 * Run: npx tsx scripts/fetch-all-locations.ts
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

interface Country {
  id: number
  name: string
  iso2: string
  iso3: string
  numeric_code: string
  phonecode: string
  capital: string
  currency: string
  currency_name: string
  currency_symbol: string
  tld: string
  native: string
  region: string
  subregion: string
  nationality: string
  timezones: any[]
  translations: Record<string, string>
  latitude: string
  longitude: string
  emoji: string
  emojiU: string
}

interface State {
  id: number
  name: string
  country_code: string
  state_code: string
  latitude?: string
  longitude?: string
  type?: string
}

interface City {
  id: number | string
  name: string
  state_code?: string
  country_code?: string
  latitude?: string
  longitude?: string
  type?: string
}

interface LocationData {
  countries: Record<string, Country>
  states: Record<string, State[]> // keyed by country_code
  cities: Record<string, City[]> // keyed by country_code
  citiesByState: Record<string, City[]> // keyed by country_code-state_code
  metadata: {
    fetchedAt: string
    totalCountries: number
    totalStates: number
    totalCities: number
  }
}

const API_BASE_URL = 'https://api.countrystatecity.in/v1'
const API_KEY = process.env.COUNTRY_STATE_CITY_API_KEY

if (!API_KEY) {
  console.error('❌ COUNTRY_STATE_CITY_API_KEY environment variable is required')
  process.exit(1)
}

const headers = {
  'X-CSCAPI-KEY': API_KEY,
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })
      if (response.ok) return response
      if (response.status === 429) {
        // Rate limited - wait and retry
        const waitTime = Math.pow(2, i) * 1000 // Exponential backoff
        console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      }
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    } catch (error: any) {
      if (i === retries - 1) throw error
      if (error.name === 'AbortError') {
        console.log(`⏳ Timeout, retrying... (${i + 1}/${retries})`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      } else {
        throw error
      }
    }
  }
  throw new Error('Max retries exceeded')
}

async function fetchAllCountries(): Promise<Country[]> {
  console.log('🌍 Fetching all countries...')
  const response = await fetchWithRetry(`${API_BASE_URL}/countries`)
  const countries: Country[] = await response.json()
  console.log(`✅ Fetched ${countries.length} countries`)
  return countries
}

async function fetchStatesForCountry(countryCode: string): Promise<State[]> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/countries/${countryCode}/states`)
    const states: State[] = await response.json()
    return states
  } catch (error: any) {
    console.warn(`⚠️  Failed to fetch states for ${countryCode}: ${error.message}`)
    return []
  }
}

async function fetchCitiesForCountry(countryCode: string): Promise<City[]> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/countries/${countryCode}/cities`)
    const cities: City[] = await response.json()
    return cities
  } catch (error: any) {
    console.warn(`⚠️  Failed to fetch cities for ${countryCode}: ${error.message}`)
    return []
  }
}

async function fetchCitiesForState(countryCode: string, stateCode: string): Promise<City[]> {
  try {
    const response = await fetchWithRetry(
      `${API_BASE_URL}/countries/${countryCode}/states/${stateCode}/cities`
    )
    const cities: City[] = await response.json()
    return cities.map(city => ({
      ...city,
      state_code: stateCode,
      country_code: countryCode,
    }))
  } catch (error: any) {
    console.warn(`⚠️  Failed to fetch cities for ${countryCode}/${stateCode}: ${error.message}`)
    return []
  }
}

async function main() {
  console.log('🚀 Starting data fetch...\n')

  const startTime = Date.now()
  const data: LocationData = {
    countries: {},
    states: {},
    cities: {},
    citiesByState: {},
    metadata: {
      fetchedAt: new Date().toISOString(),
      totalCountries: 0,
      totalStates: 0,
      totalCities: 0,
    },
  }

  // Step 1: Fetch all countries
  const countries = await fetchAllCountries()
  for (const country of countries) {
    data.countries[country.iso2] = country
  }
  data.metadata.totalCountries = countries.length
  console.log(`\n📊 Progress: ${countries.length} countries loaded\n`)

  // Step 2: Fetch states and cities for each country
  let processedCountries = 0
  for (const country of countries) {
    processedCountries++
    const countryCode = country.iso2
    console.log(
      `[${processedCountries}/${countries.length}] Processing ${country.name} (${countryCode})...`
    )

    // Fetch states
    const states = await fetchStatesForCountry(countryCode)
    data.states[countryCode] = states
    data.metadata.totalStates += states.length

    // Fetch cities (two approaches: by country or by state)
    // Approach 1: Fetch all cities for country (faster but may not have state_code)
    const citiesByCountry = await fetchCitiesForCountry(countryCode)
    
    // Approach 2: Fetch cities by state (slower but has state_code)
    // Only do this for countries with states
    if (states.length > 0 && states.length < 100) {
      // For countries with reasonable number of states, fetch by state
      console.log(`  📍 Fetching cities for ${states.length} states...`)
      for (const state of states) {
        const stateCities = await fetchCitiesForState(countryCode, state.state_code)
        const key = `${countryCode}-${state.state_code}`
        data.citiesByState[key] = stateCities
        data.metadata.totalCities += stateCities.length
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } else {
      // For countries with many states or no states, use country-level cities
      console.log(`  📍 Using country-level cities (${citiesByCountry.length} cities)...`)
      data.cities[countryCode] = citiesByCountry.map(city => ({
        ...city,
        country_code: countryCode,
      }))
      data.metadata.totalCities += citiesByCountry.length
    }

    // Progress update
    if (processedCountries % 10 === 0) {
      console.log(
        `\n📊 Progress: ${processedCountries}/${countries.length} countries, ` +
        `${data.metadata.totalStates} states, ${data.metadata.totalCities} cities\n`
      )
    }

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  // Step 3: Save to JSON file
  const outputPath = join(process.cwd(), 'lib', 'data', 'locations.json')
  console.log(`\n💾 Saving data to ${outputPath}...`)
  writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8')

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2)
  console.log(`\n✅ Complete!`)
  console.log(`📊 Statistics:`)
  console.log(`   - Countries: ${data.metadata.totalCountries}`)
  console.log(`   - States: ${data.metadata.totalStates}`)
  console.log(`   - Cities: ${data.metadata.totalCities}`)
  console.log(`   - Duration: ${duration} minutes`)
  console.log(`   - Output: ${outputPath}`)
}

main().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})

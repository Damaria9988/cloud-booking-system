import { NextRequest, NextResponse } from 'next/server'

/**
 * Direct API test - tests the Country State City API directly
 * GET /api/test-api-direct
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.COUNTRY_STATE_CITY_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key not found in environment variables',
      }, { status: 400 })
    }

    const baseUrl = 'https://api.countrystatecity.in/v1'
    const headers = {
      'X-CSCAPI-KEY': apiKey,
    }

    // Test 1: Get US cities (should return many cities)
    console.log('Testing: Fetching US cities...')
    const usCitiesResponse = await fetch(`${baseUrl}/countries/US/cities`, {
      headers,
      signal: AbortSignal.timeout(10000),
    })

    let usCitiesData: any = null
    if (usCitiesResponse.ok) {
      usCitiesData = await usCitiesResponse.json()
      console.log(`✓ US cities fetched: ${Array.isArray(usCitiesData) ? usCitiesData.length : 'unknown'} cities`)
    } else {
      const errorText = await usCitiesResponse.text()
      console.error(`✗ US cities failed: ${usCitiesResponse.status} - ${errorText}`)
    }

    // Test 2: Search for New York in US cities
    let newYorkResults: any[] = []
    if (Array.isArray(usCitiesData)) {
      newYorkResults = usCitiesData.filter((city: any) => 
        city.name?.toLowerCase().includes('new york')
      )
      console.log(`✓ Found ${newYorkResults.length} cities matching "New York"`)
    }

    // Test 3: Get country info
    console.log('Testing: Fetching US country info...')
    const countryResponse = await fetch(`${baseUrl}/countries/US`, {
      headers,
      signal: AbortSignal.timeout(5000),
    })

    let countryData: any = null
    if (countryResponse.ok) {
      countryData = await countryResponse.json()
      console.log(`✓ Country info: ${countryData.name || 'N/A'}`)
    } else {
      const errorText = await countryResponse.text()
      console.error(`✗ Country info failed: ${countryResponse.status} - ${errorText}`)
    }

    return NextResponse.json({
      success: true,
      apiKeyPresent: true,
      apiKeyLength: apiKey.length,
      tests: {
        usCities: {
          status: usCitiesResponse.status,
          statusText: usCitiesResponse.statusText,
          count: Array.isArray(usCitiesData) ? usCitiesData.length : 0,
          sample: Array.isArray(usCitiesData) ? usCitiesData.slice(0, 3) : null,
        },
        newYorkSearch: {
          found: newYorkResults.length,
          results: newYorkResults.slice(0, 5),
        },
        countryInfo: {
          status: countryResponse.status,
          data: countryData,
        },
      },
    })
  } catch (error: any) {
    console.error('Direct API test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { searchCities } from '@/lib/apis/country-state-city'

/**
 * Test endpoint to verify API connection
 * GET /api/test-location-search?q=New York
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || 'New York'

    console.log(`\n=== Testing location search ===`)
    console.log(`Query: "${query}"`)
    console.log(`API Key present: ${!!process.env.COUNTRY_STATE_CITY_API_KEY}`)
    console.log(`API Key length: ${process.env.COUNTRY_STATE_CITY_API_KEY?.length || 0}`)
    console.log(`API Key first 10 chars: ${process.env.COUNTRY_STATE_CITY_API_KEY?.substring(0, 10) || 'N/A'}...`)

    const startTime = Date.now()
    const results = await searchCities(query, 5)
    const duration = Date.now() - startTime

    console.log(`Search completed in ${duration}ms`)
    console.log(`Results found: ${results.length}`)
    if (results.length > 0) {
      console.log(`Sample result: ${results[0].fullName}`)
    }
    console.log(`=== End test ===\n`)

    return NextResponse.json({
      success: true,
      query,
      resultsCount: results.length,
      results,
      apiKeyPresent: !!process.env.COUNTRY_STATE_CITY_API_KEY,
      duration: `${duration}ms`,
    })
  } catch (error: any) {
    console.error('Test search error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}

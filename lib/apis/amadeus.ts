// Amadeus API client configuration
// NOTE: Currently using local Indian locations database due to Amadeus API issues
// When Amadeus is back online, uncomment the code below

import { searchIndianLocations, type IndianLocation } from '@/lib/data/indian-locations'

// Initialize Amadeus client (commented out due to API issues)
// const amadeus = new Amadeus({
//   clientId: process.env.AMADEUS_API_KEY || '',
//   clientSecret: process.env.AMADEUS_API_SECRET || '',
//   hostname: process.env.AMADEUS_API_KEY ? 'production' : 'test',
// })

/**
 * Search for airports and cities (for autocomplete)
 * Currently using local Indian locations database
 * Focused on India
 */
export async function searchLocations(query: string) {
  try {
    if (!query || query.length < 2) {
      return []
    }

    // Use local Indian locations database (works offline, no API needed)
    const locations = searchIndianLocations(query, 10)
    
    // Format to match Amadeus API response format
    return locations.map((loc) => ({
      iataCode: loc.code,
      name: loc.name,
      detailedName: loc.detailedName,
      type: loc.type,
      subType: loc.type,
    }))

    // Uncomment below when Amadeus API is back online:
    /*
    const response = await amadeus.referenceData.locations.get({
      keyword: query,
      subType: 'AIRPORT,CITY',
      countryCode: 'IN',
      view: 'LIGHT',
      max: 10,
    })

    return response.data || []
    */
  } catch (error: any) {
    console.error('Location search error:', error)
    // Fallback to local database
    const locations = searchIndianLocations(query, 10)
    return locations.map((loc) => ({
      iataCode: loc.code,
      name: loc.name,
      detailedName: loc.detailedName,
      type: loc.type,
      subType: loc.type,
    }))
  }
}

/**
 * Search for flights
 * NOTE: Requires Amadeus API to be online and configured
 * Uncomment when Amadeus API is back online
 */
export async function searchFlights(params: {
  origin: string
  destination: string
  departureDate: string
  adults: number
  children?: number
  infants?: number
}) {
  // TODO: Uncomment when Amadeus API is back online
  throw new Error('Amadeus API is currently unavailable. Flight search will be available when API is restored.')
  
  /*
  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      adults: params.adults,
      children: params.children || 0,
      infants: params.infants || 0,
      currencyCode: 'INR',
      max: 20,
    })

    return response.data || []
  } catch (error: any) {
    console.error('Amadeus flight search error:', error)
    throw error
  }
  */
}

/**
 * Get flight offers with pricing
 * NOTE: Requires Amadeus API to be online and configured
 * Uncomment when Amadeus API is back online
 */
export async function getFlightOffers(params: {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults: number
  children?: number
  infants?: number
}) {
  // TODO: Uncomment when Amadeus API is back online
  throw new Error('Amadeus API is currently unavailable. Flight search will be available when API is restored.')
  
  /*
  try {
    const searchParams: any = {
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      adults: params.adults,
      currencyCode: 'INR',
      max: 20,
    }

    if (params.returnDate) {
      searchParams.returnDate = params.returnDate
    }

    if (params.children) {
      searchParams.children = params.children
    }

    if (params.infants) {
      searchParams.infants = params.infants
    }

    const response = await amadeus.shopping.flightOffersSearch.get(searchParams)

    return response.data || []
  } catch (error: any) {
    console.error('Amadeus flight offers error:', error)
    throw error
  }
  */
}

// Export default (commented out until Amadeus is back online)
// export default amadeus


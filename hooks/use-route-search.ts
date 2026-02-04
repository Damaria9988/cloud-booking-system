/**
 * Custom hook for route search functionality
 * Handles route fetching, error handling, and state management
 */

import { useState, useCallback, useRef, useEffect } from "react"

export interface Route {
  id: number
  operator: string
  rating: number
  reviews: number
  fromCity: string
  fromState?: string
  fromCountry?: string
  toCity: string
  toState?: string
  toCountry?: string
  departureTime: string
  arrivalTime: string
  duration: string
  vehicleType: string
  transportType?: string
  basePrice: number
  amenities: string[]
  availableSeats: number
  totalSeats: number
  travelDate?: string
  scheduleId?: number
}

export interface UseRouteSearchOptions {
  mode: string
  from: string
  to: string
  date: string
  returnDate?: string
  tripType?: "one-way" | "round-trip"
  adults?: number
  children?: number
  infants?: number
}

export function useRouteSearch(options: UseRouteSearchOptions) {
  const { mode, from, to, date, returnDate, tripType, adults = 1, children = 0, infants = 0 } = options
  
  const [routes, setRoutes] = useState<Route[]>([])
  const [returnRoutes, setReturnRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingReturn, setLoadingReturn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchRoutes = useCallback(async (isReturn = false) => {
    // Cancel previous request if it exists
    if (abortControllerRef.current && !isReturn) {
      abortControllerRef.current.abort()
    }

    // Only show loading spinner on initial load, otherwise keep showing previous results
    if (isInitialLoad && !isReturn) {
      setLoading(true)
    }
    if (isReturn) {
      setLoadingReturn(true)
    }
    setError(null)

    try {
      // Create new abort controller
      abortControllerRef.current = new AbortController()

      const params = new URLSearchParams()

      // For round trip return, swap from/to
      const searchFrom = isReturn ? to : from
      const searchTo = isReturn ? from : to
      const searchDate = isReturn ? returnDate : date

      // Sanitize city names
      const sanitizeCityName = (city: string): string => {
        return city
          .trim()
          .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
          .substring(0, 100) // Limit length
      }

      // Validate date format (YYYY-MM-DD)
      const validateDate = (dateString: string): boolean => {
        if (!dateString) return false
        const date = new Date(dateString)
        return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateString)
      }

      // Progressive filtering: search with from city only, or both from and to
      if (searchFrom) {
        // Extract city, state, and country from location string (format: "City, State, Country")
        const fromParts = searchFrom.split(",").map(s => s.trim())
        const fromCity = sanitizeCityName(fromParts[0])
        const fromState = fromParts.length >= 2 ? fromParts[1] : undefined
        const fromCountry = fromParts.length >= 3 ? fromParts.slice(2).join(", ") : undefined
        
        if (fromCity) {
          params.append("from", fromCity)
          if (fromState) {
            params.append("fromState", fromState)
          }
          if (fromCountry) {
            params.append("fromCountry", fromCountry)
          }
          
          // If to city is also provided, add it for filtering
          if (searchTo) {
            const toParts = searchTo.split(",").map(s => s.trim())
            const toCity = sanitizeCityName(toParts[0])
            const toState = toParts.length >= 2 ? toParts[1] : undefined
            const toCountry = toParts.length >= 3 ? toParts.slice(2).join(", ") : undefined
            
            if (toCity) {
              params.append("to", toCity)
              if (toState) {
                params.append("toState", toState)
              }
              if (toCountry) {
                params.append("toCountry", toCountry)
              }
            }
          }
        }
        
        if (searchDate && validateDate(searchDate)) {
          params.append("date", searchDate)
        }
      }

      // Always filter by transport type based on mode
      if (mode) {
        params.append("transportType", mode)
      }

      const response = await fetch(`/api/routes?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch routes: ${response.statusText}`)
      }

      const data = await response.json()

      if (isReturn) {
        setReturnRoutes(data.routes || [])
      } else {
        setRoutes(data.routes || [])
        setIsInitialLoad(false)
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError') {
        return
      }
      
      console.error("Error fetching routes:", error)
      setError(error.message || "Failed to fetch routes. Please try again.")
      if (isReturn) {
        setReturnRoutes([])
      } else {
        setRoutes([])
      }
    } finally {
      if (isReturn) {
        setLoadingReturn(false)
      } else {
        setLoading(false)
      }
    }
  }, [mode, from, to, date, returnDate, isInitialLoad])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    routes,
    returnRoutes,
    loading,
    loadingReturn,
    error,
    isInitialLoad,
    fetchRoutes,
    refetch: () => fetchRoutes(false),
    refetchReturn: () => fetchRoutes(true),
  }
}

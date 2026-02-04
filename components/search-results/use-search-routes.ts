"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { usePublicUpdates, useSocketIO, type SocketIOMessage } from "@/hooks/use-socketio"

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

interface UseSearchRoutesProps {
  mode: string
  from: string
  to: string
  date: string
  tripType?: "one-way" | "round-trip"
  returnDate?: string
  refreshKey?: number
}

export function useSearchRoutes({
  mode,
  from,
  to,
  date,
  tripType = "one-way",
  returnDate = "",
  refreshKey = 0,
}: UseSearchRoutesProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  const [routes, setRoutes] = useState<Route[]>([])
  const [returnRoutes, setReturnRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingReturn, setLoadingReturn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forceRefresh, setForceRefresh] = useState(0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [navigatingTo, setNavigatingTo] = useState<number | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const prefetchedRoutes = useRef<Set<number>>(new Set())
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Format time helper
  const formatTime = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Reset navigation state when pathname changes
  useEffect(() => {
    if (navigatingTo !== null && pathname?.startsWith('/seats/')) {
      const resetTimer = setTimeout(() => {
        setNavigatingTo(null)
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current)
          navigationTimeoutRef.current = null
        }
      }, 300)
      return () => clearTimeout(resetTimer)
    }
  }, [pathname, navigatingTo])

  // Safety timeout for navigation
  useEffect(() => {
    if (navigatingTo !== null) {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
      
      navigationTimeoutRef.current = setTimeout(() => {
        if (pathname === '/search' && navigatingTo !== null) {
          setNavigatingTo(null)
        }
        navigationTimeoutRef.current = null
      }, 5000)
      
      return () => {
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current)
          navigationTimeoutRef.current = null
        }
      }
    }
  }, [navigatingTo, pathname])

  // Fetch routes function
  const fetchRoutes = useCallback(async (isReturn = false) => {
    if (abortControllerRef.current && !isReturn) {
      abortControllerRef.current.abort()
    }

    if (isInitialLoad && !isReturn) {
      setLoading(true)
    }
    if (isReturn) {
      setLoadingReturn(true)
    }
    setError(null)

    try {
      const params = new URLSearchParams()
      const searchFrom = isReturn ? to : from
      const searchTo = isReturn ? from : to
      const searchDate = isReturn ? returnDate : date

      const sanitizeCityName = (city: string): string => {
        return city.trim().replace(/[<>\"']/g, '').substring(0, 100)
      }

      const validateDate = (dateString: string): boolean => {
        if (!dateString) return false
        const d = new Date(dateString)
        return !isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateString)
      }

      if (searchFrom) {
        const fromParts = searchFrom.split(",").map(s => s.trim())
        const fromCity = sanitizeCityName(fromParts[0])
        const fromState = fromParts.length >= 2 ? fromParts[1] : undefined
        const fromCountry = fromParts.length >= 3 ? fromParts.slice(2).join(", ") : undefined
        
        if (fromCity) {
          params.append("from", fromCity)
          if (fromState) params.append("fromState", fromState)
          if (fromCountry) params.append("fromCountry", fromCountry)
          
          if (searchTo) {
            const toParts = searchTo.split(",").map(s => s.trim())
            const toCity = sanitizeCityName(toParts[0])
            const toState = toParts.length >= 2 ? toParts[1] : undefined
            const toCountry = toParts.length >= 3 ? toParts.slice(2).join(", ") : undefined
            
            if (toCity) {
              params.append("to", toCity)
              if (toState) params.append("toState", toState)
              if (toCountry) params.append("toCountry", toCountry)
            }
          }
        }
        
        if (searchDate && validateDate(searchDate)) {
          params.append("date", searchDate)
        }
      }

      if (mode) {
        params.append("transportType", mode)
      }

      const controller = new AbortController()
      if (!isReturn) {
        abortControllerRef.current = controller
      }
      
      const response = await fetch(`/api/routes?${params.toString()}`, {
        cache: 'no-store',
        signal: controller.signal,
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch routes")
      }

      const filteredRoutes = data.routes || []
      
      const formattedRoutes = filteredRoutes.map((route: any) => ({
        ...route,
        departureTime: formatTime(route.departureTime || ""),
        arrivalTime: formatTime(route.arrivalTime || ""),
        duration: route.durationMinutes 
          ? `${Math.floor(route.durationMinutes / 60)}h ${route.durationMinutes % 60}m`
          : route.duration || "N/A",
      }))

      if (isReturn) {
        setReturnRoutes(formattedRoutes)
      } else {
        setRoutes(formattedRoutes)
        setIsInitialLoad(false)
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      console.error("Error fetching routes:", err)
      setError(err instanceof Error ? err.message : "Failed to load routes")
      if (!isReturn) setIsInitialLoad(false)
    } finally {
      if (isReturn) {
        setLoadingReturn(false)
      } else {
        setLoading(false)
        abortControllerRef.current = null
      }
    }
  }, [from, to, date, mode, returnDate, isInitialLoad])

  // WebSocket: Listen for route updates
  usePublicUpdates(
    () => setForceRefresh(prev => prev + 1),
    () => setForceRefresh(prev => prev + 1)
  )

  // Socket.IO: Real-time seat updates
  const handleSeatUpdate = useCallback((message: SocketIOMessage) => {
    if (message.type === 'seat_update') {
      const { scheduleId, availableSeats } = message.data
      
      setRoutes((prevRoutes) =>
        prevRoutes.map((route) => 
          route.scheduleId === scheduleId 
            ? { ...route, availableSeats: typeof availableSeats === 'number' ? availableSeats : availableSeats }
            : route
        )
      )
      
      setReturnRoutes((prevRoutes) =>
        prevRoutes.map((route) => 
          route.scheduleId === scheduleId 
            ? { ...route, availableSeats: typeof availableSeats === 'number' ? availableSeats : availableSeats }
            : route
        )
      )
    }
  }, [])

  const { subscribe, unsubscribe, isConnected } = useSocketIO({
    autoConnect: true,
    autoReconnect: true,
    onMessage: handleSeatUpdate,
    showToastNotifications: false,
  })

  // Subscribe to seat updates
  useEffect(() => {
    if (isConnected && (routes.length > 0 || returnRoutes.length > 0)) {
      const allScheduleIds = [
        ...routes.map((route) => route.scheduleId),
        ...returnRoutes.map((route) => route.scheduleId),
      ].filter((id): id is number => id !== undefined && id !== null)
      
      const uniqueScheduleIds = Array.from(new Set(allScheduleIds))
      uniqueScheduleIds.forEach((scheduleId) => subscribe(`schedule:${scheduleId}`))

      return () => {
        uniqueScheduleIds.forEach((scheduleId) => unsubscribe(`schedule:${scheduleId}`))
      }
    }
  }, [routes, returnRoutes, isConnected, subscribe, unsubscribe])

  // Fetch routes on dependency changes
  useEffect(() => {
    if (from || to || date || mode) {
      setIsInitialLoad(true)
    }
    fetchRoutes()
    if (tripType === "round-trip" && returnDate && from && to) {
      fetchRoutes(true)
    } else {
      setReturnRoutes([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, date, mode, tripType, returnDate, refreshKey, forceRefresh])

  // Prefetch routes
  useEffect(() => {
    if (routes.length > 0) {
      routes.forEach((trip) => {
        if (!prefetchedRoutes.current.has(trip.id)) {
          prefetchedRoutes.current.add(trip.id)
          
          fetch(`/api/routes/${trip.id}`).then(res => res.json()).then(data => {
            if (typeof window !== 'undefined' && data.route) {
              try {
                sessionStorage.setItem(`route-${trip.id}`, JSON.stringify(data.route))
              } catch (e) {}
            }
          }).catch(() => {})
          
          if (trip.scheduleId) {
            fetch(`/api/routes/${trip.id}/seats?scheduleId=${trip.scheduleId}`).catch(() => {})
          }
          
          // IMPORTANT: Prioritize user's searched date over API-returned travelDate
          const tripDate = date || trip.travelDate || ""
          const seatUrl = `/seats/${trip.id}?mode=${mode}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(tripDate)}&scheduleId=${trip.scheduleId || ""}`
          router.prefetch(seatUrl)
        }
      })
    }
  }, [routes, mode, from, to, date, router])

  return {
    routes,
    returnRoutes,
    loading,
    loadingReturn,
    error,
    isInitialLoad,
    navigatingTo,
    setNavigatingTo,
  }
}

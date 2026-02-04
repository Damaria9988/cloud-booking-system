/**
 * Routes data fetching and management hook
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { usePolling } from "@/hooks/use-polling"

export interface Route {
  id: number
  from_city: string
  from_state: string
  from_country?: string
  to_city: string
  to_state: string
  to_country?: string
  operator_id: number
  operator_name: string
  vehicle_type: string
  transport_type?: string
  departure_time: string
  arrival_time: string
  duration_minutes: number
  base_price: number
  total_seats: number
  status: string
}

export function useRoutes() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const fetchRoutes = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/routes")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch routes")
      }

      const routesData = data.routes || []
      const routeMap = new Map<number, Route>()
      routesData.forEach((route: Route) => {
        routeMap.set(route.id, route)
      })
      const uniqueRoutes = Array.from(routeMap.values())
      uniqueRoutes.sort((a, b) => b.id - a.id)

      setRoutes(uniqueRoutes)
      setLoading(false)
    } catch (err) {
      console.error("Error fetching routes:", err)
      setError(err instanceof Error ? err.message : "Failed to load routes")
      setLoading(false)
    }
  }, [])

  usePolling(fetchRoutes, { interval: 5000 })

  useEffect(() => {
    const handleRefresh = () => fetchRoutes()
    window.addEventListener("admin:refresh-routes", handleRefresh)
    return () => window.removeEventListener("admin:refresh-routes", handleRefresh)
  }, [fetchRoutes])

  // Scroll lock - prevent page scroll when cursor is over table
  useEffect(() => {
    const container = tableContainerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      const isScrollable = container.scrollHeight > container.clientHeight
      e.preventDefault()
      if (isScrollable) {
        container.scrollTop += e.deltaY
      }
    }

    container.addEventListener("wheel", handleWheel, { passive: false })
    return () => container.removeEventListener("wheel", handleWheel)
  }, [loading, routes])

  return {
    routes,
    loading,
    error,
    fetchRoutes,
    tableContainerRef,
  }
}

/**
 * Format duration from minutes to human readable
 */
export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

/**
 * Format location avoiding duplicates (e.g., "Singapore, Singapore, Singapore" → "Singapore")
 */
export function formatLocation(city: string, state: string, country?: string) {
  const parts: string[] = [city]
  
  if (state && state.toLowerCase() !== city.toLowerCase()) {
    parts.push(state)
  }
  
  if (country && 
      country.toLowerCase() !== city.toLowerCase() && 
      country.toLowerCase() !== state.toLowerCase()) {
    parts.push(country)
  }
  
  return parts.join(", ")
}

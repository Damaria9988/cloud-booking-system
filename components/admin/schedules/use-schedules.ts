"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { usePolling } from "@/hooks/use-polling"
import { toast } from "sonner"

interface UseSchedulesOptions {
  showNext30Days?: boolean
}

export function useSchedules({ showNext30Days = true }: UseSchedulesOptions = {}) {
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set())

  const fetchSchedules = useCallback(async (showLoadingSpinner = false) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true)
      }
      
      const response = await fetch("/api/admin/schedules")
      const data = await response.json()

      if (!response.ok) {
        console.error("Schedule fetch error:", data)
        throw new Error(data.error || data.details || "Failed to fetch schedules")
      }
      
      // Deduplicate schedules by route_id and travel_date
      const schedulesData = data.schedules || []
      const scheduleMap = new Map<string, any>()
      
      schedulesData.forEach((schedule: any) => {
        let normalizedDate = schedule.travel_date
        if (normalizedDate) {
          normalizedDate = normalizedDate.split('T')[0].split(' ')[0]
        }
        
        const key = `${schedule.route_id}_${normalizedDate}`
        const existing = scheduleMap.get(key)
        
        if (!existing) {
          scheduleMap.set(key, schedule)
        } else if (schedule.id < existing.id) {
          scheduleMap.set(key, schedule)
        }
      })
      
      const uniqueSchedules = Array.from(scheduleMap.values())
      
      // Sort by travel date
      uniqueSchedules.sort((a, b) => {
        const dateA = new Date(a.travel_date).getTime()
        const dateB = new Date(b.travel_date).getTime()
        return dateA - dateB
      })
      
      setSchedules(uniqueSchedules)
      
      if (showLoadingSpinner) {
        setLoading(false)
      }
    } catch (err) {
      console.error("Error fetching schedules:", err)
      toast.error("Failed to fetch schedules", {
        description: err instanceof Error ? err.message : "Please try again later"
      })
      if (showLoadingSpinner) {
        setLoading(false)
      }
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchSchedules(true)
  }, [fetchSchedules])

  // Polling every 5 seconds
  usePolling(() => fetchSchedules(false), { interval: 5000 })

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => fetchSchedules(true)
    window.addEventListener("admin:refresh-schedules", handleRefresh)
    return () => window.removeEventListener("admin:refresh-schedules", handleRefresh)
  }, [fetchSchedules])

  // Group schedules by route
  const groupedSchedules = useMemo(() => {
    const groups = new Map<string, any[]>()
    
    schedules.forEach((schedule) => {
      if (showNext30Days) {
        const scheduleDate = new Date(schedule.travel_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const thirtyDaysLater = new Date(today)
        thirtyDaysLater.setDate(today.getDate() + 30)
        
        if (scheduleDate < today || scheduleDate > thirtyDaysLater) {
          return
        }
      }
      
      const routeKey = `${schedule.route_id}|${schedule.from_city}|${schedule.to_city}|${schedule.operator_name}`
      if (!groups.has(routeKey)) {
        groups.set(routeKey, [])
      }
      groups.get(routeKey)!.push(schedule)
    })
    
    // Sort schedules within each group by date
    groups.forEach((schedules) => {
      schedules.sort((a, b) => {
        const dateA = new Date(a.travel_date).getTime()
        const dateB = new Date(b.travel_date).getTime()
        return dateA - dateB
      })
    })
    
    return Array.from(groups.entries()).map(([key, schedules]) => {
      const [routeId, fromCity, toCity, operatorName] = key.split('|')
      const firstSchedule = schedules[0]
      return {
        key,
        routeId: parseInt(routeId),
        fromCity,
        toCity,
        operatorName,
        vehicleType: firstSchedule.vehicle_type,
        fromState: firstSchedule.from_state,
        toState: firstSchedule.to_state,
        schedules,
      }
    })
  }, [schedules, showNext30Days])

  const toggleRoute = useCallback((routeKey: string) => {
    setExpandedRoutes((prev) => {
      const next = new Set(prev)
      if (next.has(routeKey)) {
        next.delete(routeKey)
      } else {
        next.add(routeKey)
      }
      return next
    })
  }, [])

  return {
    schedules,
    groupedSchedules,
    loading,
    expandedRoutes,
    toggleRoute,
    fetchSchedules,
  }
}

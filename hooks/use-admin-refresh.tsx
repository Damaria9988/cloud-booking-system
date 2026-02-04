"use client"

import { createContext, useContext, useCallback, useState, type ReactNode } from "react"

interface AdminRefreshContextType {
  refreshAll: () => void
  refreshStats: () => void
  refreshBookings: () => void
  refreshRoutes: () => void
  refreshSchedules: () => void
  refreshCustomers: () => void
}

const AdminRefreshContext = createContext<AdminRefreshContextType | null>(null)

export function AdminRefreshProvider({ children }: { children: ReactNode }) {
  // Used only to force a rerender for any consumers that care
  const [, setRefreshKey] = useState(0)

  const refreshStats = useCallback(() => {
    window.dispatchEvent(new CustomEvent("admin:refresh-stats"))
  }, [])

  const refreshBookings = useCallback(() => {
    window.dispatchEvent(new CustomEvent("admin:refresh-bookings"))
  }, [])

  const refreshRoutes = useCallback(() => {
    window.dispatchEvent(new CustomEvent("admin:refresh-routes"))
  }, [])

  const refreshSchedules = useCallback(() => {
    window.dispatchEvent(new CustomEvent("admin:refresh-schedules"))
  }, [])

  const refreshCustomers = useCallback(() => {
    window.dispatchEvent(new CustomEvent("admin:refresh-customers"))
  }, [])

  const refreshAll = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
    refreshStats()
    refreshBookings()
    refreshRoutes()
    refreshSchedules()
    refreshCustomers()
  }, [refreshStats, refreshBookings, refreshRoutes, refreshSchedules, refreshCustomers])

  return (
    <AdminRefreshContext.Provider
      value={{
        refreshAll,
        refreshStats,
        refreshBookings,
        refreshRoutes,
        refreshSchedules,
        refreshCustomers,
      }}
    >
      {children}
    </AdminRefreshContext.Provider>
  )
}

export function useAdminRefresh() {
  const context = useContext(AdminRefreshContext)
  if (!context) {
    throw new Error("useAdminRefresh must be used within AdminRefreshProvider")
  }
  return context
}


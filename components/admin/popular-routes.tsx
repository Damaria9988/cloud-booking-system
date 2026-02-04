"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, TrendingUp, Loader2 } from "lucide-react"
import { usePolling } from "@/hooks/use-polling"

export function PopularRoutes() {
  const [routes, setRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPopularRoutes = async () => {
    try {
      const response = await fetch("/api/admin/revenue/by-route?limit=5")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch popular routes")
      }

      setRoutes(data.revenue || [])
      setLoading(false)
    } catch (err) {
      console.error("Error fetching popular routes:", err)
      setLoading(false)
    }
  }

  // Polling every 10 seconds (less frequent for charts)
  usePolling(fetchPopularRoutes, { interval: 10000 })

  useEffect(() => {
    const handleRefresh = () => fetchPopularRoutes()
    window.addEventListener("admin:refresh-stats", handleRefresh)
    return () => window.removeEventListener("admin:refresh-stats", handleRefresh)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Popular Routes</CardTitle>
          <CardDescription>Most booked routes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Routes</CardTitle>
        <CardDescription>Most booked routes by revenue</CardDescription>
      </CardHeader>
      <CardContent>
        {routes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No booking data available yet
          </div>
        ) : (
          <div className="space-y-4">
            {routes.map((route, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {route.from_location || route.from} → {route.to_location || route.to}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {route.booking_count || 0} bookings • ₹{parseFloat(route.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

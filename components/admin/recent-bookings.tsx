"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { usePolling } from "@/hooks/use-polling"

export function RecentBookings() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecentBookings = async () => {
    try {
      const response = await fetch("/api/admin/bookings?limit=5")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch bookings")
      }

      setBookings(data.bookings?.slice(0, 5) || [])
      setLoading(false)
    } catch (err) {
      console.error("Error fetching recent bookings:", err)
      setLoading(false)
    }
  }

  // Polling every 5 seconds + listen for manual refresh events
  usePolling(fetchRecentBookings, { interval: 5000 })

  useEffect(() => {
    const handleRefresh = () => fetchRecentBookings()
    window.addEventListener("admin:refresh-bookings", handleRefresh)
    return () => window.removeEventListener("admin:refresh-bookings", handleRefresh)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Latest customer bookings across all routes</CardDescription>
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
        <CardTitle>Recent Bookings</CardTitle>
        <CardDescription>Latest customer bookings across all routes</CardDescription>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No bookings yet. Bookings will appear here once customers start making reservations.
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="space-y-1">
                    <div className="font-medium">{booking.userName || "Guest User"}</div>
                    <div className="text-sm text-muted-foreground">PNR: {booking.pnr}</div>
                  </div>

                  <div className="hidden md:block text-sm text-muted-foreground">
                    {booking.from} → {booking.to}
                  </div>

                  <div className="hidden lg:block text-sm text-muted-foreground">
                    {(() => {
                      try {
                        if (!booking.date) return "N/A"
                        const date = new Date(booking.date)
                        if (isNaN(date.getTime())) {
                          // Try parsing as YYYY-MM-DD format
                          const parts = booking.date.split('-')
                          if (parts.length === 3) {
                            const year = parseInt(parts[0])
                            const month = parseInt(parts[1]) - 1
                            const day = parseInt(parts[2])
                            const parsedDate = new Date(year, month, day)
                            if (!isNaN(parsedDate.getTime())) {
                              return parsedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' })
                            }
                          }
                          return booking.date // Return original if can't parse
                        }
                        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' })
                      } catch {
                        return booking.date || "N/A"
                      }
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold">
                      ₹{booking.finalAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <Badge
                      variant={
                        booking.status === "completed"
                          ? "default"
                          : booking.status === "confirmed" || booking.status === "ticketed"
                          ? "default"
                          : booking.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                      className={
                        booking.status === "completed"
                          ? "mt-1 bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
                          : "mt-1"
                      }
                    >
                      {booking.status}
                    </Badge>
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

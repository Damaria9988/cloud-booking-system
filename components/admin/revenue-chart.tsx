"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Loader2 } from "lucide-react"
import { usePolling } from "@/hooks/use-polling"
import { useSocketIO, type SocketIOMessage } from "@/hooks/use-socketio"

export function RevenueChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const isInitialLoad = useRef(true)

  const fetchRevenueData = useCallback(async () => {
    try {
      // Only show loading spinner on initial load, not during polling
      if (isInitialLoad.current) {
        setLoading(true)
      }
      // Get last 12 months of data (including current month)
      const endDate = new Date()
      endDate.setHours(23, 59, 59, 999) // End of today
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 11)
      startDate.setDate(1) // Start of month
      startDate.setHours(0, 0, 0, 0) // Start of day

      const response = await fetch(
        `/api/admin/revenue/by-date?dateFrom=${startDate.toISOString().split("T")[0]}&dateTo=${endDate.toISOString().split("T")[0]}&groupBy=month`
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch revenue data")
      }

      const result = await response.json()

      // Create a map of all 12 months with zero revenue
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const allMonths: { [key: string]: { name: string; revenue: number } } = {}
      
      // Initialize all months with zero revenue (using short month names like reference)
      for (let i = 0; i < 12; i++) {
        const date = new Date(startDate)
        date.setMonth(startDate.getMonth() + i)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const period = `${year}-${month}`
        const monthIndex = date.getMonth()
        allMonths[period] = {
          name: monthNames[monthIndex], // Short month name like "Jan", "Feb", etc.
          revenue: 0,
        }
      }

      // Update with actual revenue data
      if (result.revenue && Array.isArray(result.revenue)) {
        result.revenue.forEach((item: any) => {
          if (item.period && allMonths[item.period]) {
            const revenueValue = parseFloat(item.revenue || 0)
            allMonths[item.period].revenue = revenueValue
          }
        })
      }

      // Convert to array and sort by period (chronologically)
      const chartData = Object.keys(allMonths)
        .sort()
        .map(period => allMonths[period])

      setData(chartData)
      setLoading(false)
      isInitialLoad.current = false
    } catch (err) {
      console.error("Error fetching revenue data:", err)
      setData([])
      setLoading(false)
      isInitialLoad.current = false
    }
  }, [])

  // Handle real-time booking updates via Socket.IO
  const handleMessage = useCallback((message: SocketIOMessage) => {
    // Refresh chart when new booking is created or cancelled
    if (message.type === 'new_booking' || message.type === 'booking_cancelled') {
      fetchRevenueData()
    }
  }, [fetchRevenueData])

  const { subscribe, unsubscribe, isConnected } = useSocketIO({
    autoConnect: true,
    autoReconnect: true,
    onMessage: handleMessage,
    showToastNotifications: false,
  })

  // Subscribe to admin channel for real-time updates
  useEffect(() => {
    if (isConnected) {
      subscribe('admin:bookings')
      return () => unsubscribe('admin:bookings')
    }
  }, [isConnected, subscribe, unsubscribe])

  // Polling every 10 seconds (less frequent for charts) as fallback
  // Note: usePolling already handles initial fetch, no need for separate useEffect
  usePolling(fetchRevenueData, { interval: 10000 })

  useEffect(() => {
    const handleRefresh = () => fetchRevenueData()
    window.addEventListener("admin:refresh-stats", handleRefresh)
    return () => window.removeEventListener("admin:refresh-stats", handleRefresh)
  }, [fetchRevenueData])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Monthly revenue trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Monthly revenue for {new Date().getFullYear()}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No revenue data available yet
          </div>
        ) : (
          <div style={{ minHeight: "300px" }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                wrapperStyle={{ zIndex: 1000 }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  padding: "8px 12px",
                }}
                labelStyle={{
                  color: "#374151",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
                itemStyle={{
                  color: "#1f2937",
                  fontWeight: 500,
                }}
                formatter={(value: any) => [`₹${parseFloat(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Revenue']}
              />
              <Bar
                dataKey="revenue"
                fill="#000000"
                radius={[8, 8, 0, 0]}
                barSize={40}
              />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

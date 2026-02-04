"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Users, Ticket, Route, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePolling } from "@/hooks/use-polling"

export function StatsCards() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/stats")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch stats")
      }

      // Fetch additional counts
      const [routesRes, customersRes] = await Promise.all([
        fetch("/api/admin/routes"),
        fetch("/api/admin/customers"),
      ])

      const routesData = await routesRes.json()
      const customersData = await customersRes.json()

      const activeRoutes = routesData.routes?.filter((r: any) => r.status === "active").length || 0
      const totalCustomers = customersData.customers?.length || 0

      setStats({
        totalRevenue: data.stats?.totalRevenue || 0,
        totalBookings: data.stats?.totalBookings || 0,
        activeRoutes,
        totalCustomers,
      })
      setLoading(false)
    } catch (err) {
      console.error("Error fetching stats:", err)
      setLoading(false)
    }
  }, [])

  // Polling every 5 seconds + listen for manual refresh events
  usePolling(fetchStats, { interval: 5000 })

  useEffect(() => {
    const handleRefresh = () => fetchStats()
    window.addEventListener("admin:refresh-stats", handleRefresh)
    return () => window.removeEventListener("admin:refresh-stats", handleRefresh)
  }, [fetchStats])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statsData = [
    {
      title: "Total Revenue",
      value: `₹${stats?.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}`,
      change: "",
      trend: "up" as const,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Total Bookings",
      value: stats?.totalBookings.toLocaleString() || "0",
      change: "",
      trend: "up" as const,
      icon: Ticket,
      color: "text-blue-600",
    },
    {
      title: "Active Routes",
      value: stats?.activeRoutes.toLocaleString() || "0",
      change: "",
      trend: "up" as const,
      icon: Route,
      color: "text-purple-600",
    },
    {
      title: "Customers",
      value: stats?.totalCustomers.toLocaleString() || "0",
      change: "",
      trend: "up" as const,
      icon: Users,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <div className={cn("p-2 rounded-lg bg-muted", stat.color)}>
              <stat.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.change && (
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {stat.trend === "up" ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                )}
                <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>{stat.change}</span>
                <span className="ml-1">from last month</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

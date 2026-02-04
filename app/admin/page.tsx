"use client"

import { AdminSidebar } from "@/components/admin-sidebar"
import { StatsCards } from "@/components/admin/stats-cards"
import { RecentBookings } from "@/components/admin/recent-bookings"
import { RevenueChart } from "@/components/admin/revenue-chart"
import { PopularRoutes } from "@/components/admin/popular-routes"

export default function AdminDashboard() {
  // Auth is handled by the admin layout

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back! Here's what's happening with your travel business.
            </p>
          </div>

          {/* Stats Cards */}
          <StatsCards />

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-7">
            <div className="lg:col-span-4">
              <RevenueChart />
            </div>
            <div className="lg:col-span-3">
              <PopularRoutes />
            </div>
          </div>

          {/* Recent Bookings */}
          <RecentBookings />
        </div>
      </main>
    </div>
  )
}

"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { BookingsTable } from "@/components/admin/bookings-table"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function AdminBookingsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      <AdminSidebar />

      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 pb-4">
          <div className="max-w-7xl mx-auto space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bookings</h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">View and manage all customer bookings</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by PNR, name, or email..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table with built-in scrolling */}
        <div className="flex-1 max-w-7xl mx-auto w-full overflow-hidden">
          <BookingsTable searchQuery={searchQuery} />
        </div>
      </main>
    </div>
  )
}

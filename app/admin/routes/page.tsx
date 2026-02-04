"use client"

import { AdminSidebar } from "@/components/admin-sidebar"
import { RoutesTable } from "@/components/admin/routes-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { AddRouteDialog } from "@/components/admin/add-route-dialog"

export default function RoutesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      <AdminSidebar />

      <main className="flex-1 flex flex-col p-6 lg:p-8 min-h-0 overflow-hidden">
        {/* Header - fixed height */}
        <div className="flex-shrink-0 pb-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Routes</h1>
              <p className="text-muted-foreground mt-2">Manage all your travel routes and schedules</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="bg-accent hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Route
            </Button>
          </div>
        </div>

        {/* Table container - takes remaining space, no page scroll */}
        <div className="flex-1 max-w-7xl mx-auto w-full min-h-0 overflow-hidden">
          <RoutesTable />
        </div>

        <AddRouteDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={() => {
            window.dispatchEvent(new CustomEvent("admin:refresh-routes"))
          }}
        />
      </main>
    </div>
  )
}

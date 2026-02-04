"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { EditRouteDialog } from "@/components/admin/edit-route-dialog"
import { useRoutes, Route } from "./use-routes"
import { RouteTableRow } from "./route-table-row"
import { DeleteRouteDialog } from "./route-dialogs"

const HEADERS = ["Route", "Operator", "Transport", "Type", "Duration", "Price", "Seats", "Status", "Actions"]

export function RoutesTable() {
  const { routes, loading, error, fetchRoutes, tableContainerRef } = useRoutes()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null)

  const handleEdit = (route: Route) => {
    setSelectedRoute(route)
    setEditDialogOpen(true)
  }

  const handleDelete = (route: Route) => {
    setRouteToDelete(route)
    setDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <Card className="h-full py-0 gap-0 overflow-hidden">
        <CardContent className="p-0 flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-full py-0 gap-0 overflow-hidden">
        <CardContent className="p-0 flex-1 flex items-center justify-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-[calc(100vh-220px)] min-h-[400px] py-0 gap-0">
      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
        {/* Fixed Table Header - pr-[17px] compensates for scrollbar width */}
        <div className="flex-shrink-0 border-b border-border bg-muted/50 pr-[17px]">
          <table className="w-full table-fixed">
            <colgroup><col className="w-[20%]" /><col className="w-[17%]" /><col className="w-[9%]" /><col className="w-[11%]" /><col className="w-[9%]" /><col className="w-[9%]" /><col className="w-[7%]" /><col className="w-[9%]" /><col className="w-[9%]" /></colgroup>
            <thead>
              <tr>
                {HEADERS.map((label, i) => (
                  <th
                    key={label}
                    className={`px-4 py-5 text-xs font-semibold uppercase tracking-wide ${
                      i === HEADERS.length - 1 ? "text-center" : "text-left"
                    }`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable Table Body - overflow-y-scroll ensures scrollbar space is always reserved */}
        <div ref={tableContainerRef} className="flex-1 overflow-y-scroll scrollbar-thin">
          <table className="w-full table-fixed">
            <colgroup><col className="w-[20%]" /><col className="w-[17%]" /><col className="w-[9%]" /><col className="w-[11%]" /><col className="w-[9%]" /><col className="w-[9%]" /><col className="w-[7%]" /><col className="w-[9%]" /><col className="w-[9%]" /></colgroup>
            <tbody>
              {routes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                    No routes found. Create your first route to get started.
                  </td>
                </tr>
              ) : (
                routes.map((route) => (
                  <RouteTableRow
                    key={route.id}
                    route={route}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      <EditRouteDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        route={selectedRoute}
        onSuccess={() => {
          fetchRoutes()
          setEditDialogOpen(false)
          setSelectedRoute(null)
        }}
      />

      <DeleteRouteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        route={routeToDelete}
        onSuccess={() => {
          fetchRoutes()
          setRouteToDelete(null)
        }}
      />
    </Card>
  )
}

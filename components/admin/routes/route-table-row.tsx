"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Route, formatDuration, formatLocation } from "./use-routes"

// Column widths - must match colgroup in routes-table.tsx
// Total: 20+17+9+11+9+9+7+9+9 = 100%
export const COL_WIDTHS = [
  "w-[20%]", "w-[17%]", "w-[9%]", "w-[11%]", "w-[9%]", "w-[9%]", "w-[7%]", "w-[9%]", "w-[9%]"
]

interface RouteTableRowProps {
  route: Route
  onEdit: (route: Route) => void
  onDelete: (route: Route) => void
}

export function RouteTableRow({ route, onEdit, onDelete }: RouteTableRowProps) {
  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      {/* Route */}
      <td className="px-4 py-3">
        <div className="font-medium text-sm truncate">
          {formatLocation(route.from_city, route.from_state, route.from_country)}
        </div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          → {formatLocation(route.to_city, route.to_state, route.to_country)}
        </div>
      </td>
      {/* Operator */}
      <td className="px-4 py-3 text-sm truncate" title={route.operator_name}>{route.operator_name}</td>
      {/* Transport */}
      <td className="px-4 py-3">
        <Badge variant="outline" className="capitalize text-xs">
          {route.transport_type || "bus"}
        </Badge>
      </td>
      {/* Type */}
      <td className="px-4 py-3">
        <Badge variant="secondary" className="text-xs truncate max-w-full">
          {route.vehicle_type}
        </Badge>
      </td>
      {/* Duration */}
      <td className="px-4 py-3 text-sm">
        {formatDuration(route.duration_minutes)}
      </td>
      {/* Price */}
      <td className="px-4 py-3 font-medium text-sm">
        ${route.base_price.toFixed(2)}
      </td>
      {/* Seats */}
      <td className="px-4 py-3 text-sm">{route.total_seats}</td>
      {/* Status */}
      <td className="px-4 py-3">
        <Badge variant={route.status === "active" ? "default" : "secondary"} className="text-xs">
          {route.status}
        </Badge>
      </td>
      {/* Actions */}
      <td className="px-4 py-3 text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(route)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(route)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}

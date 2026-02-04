"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface AddScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddScheduleDialog({ open, onOpenChange, onSuccess }: AddScheduleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [routes, setRoutes] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<string>("")
  const [travelDate, setTravelDate] = useState<string>("")
  const [availableSeats, setAvailableSeats] = useState<string>("")

  useEffect(() => {
    if (open) {
      fetchRoutes()
      setLoading(false)
      setError(null)
    }
  }, [open])

  const fetchRoutes = async () => {
    try {
      const response = await fetch("/api/admin/routes")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch routes")
      }

      setRoutes(data.routes || [])
    } catch (err) {
      console.error("Error fetching routes:", err)
      setError("Failed to load routes")
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!selectedRoute || !travelDate) {
        setError("Please select a route and travel date")
        setLoading(false)
        return
      }

      const routeId = parseInt(selectedRoute)
      const seats = availableSeats ? parseInt(availableSeats) : undefined

      const response = await fetch("/api/admin/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeId,
          travelDate,
          availableSeats: seats,
          isCancelled: false,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || "Failed to create schedule"
        // Show toast for duplicate or other errors
        if (errorMsg.includes("already exists") || errorMsg.includes("duplicate")) {
          toast.error("Duplicate Schedule", {
            description: "A schedule already exists for this route and date. Please choose a different date or route.",
          })
        } else {
          toast.error("Failed to Create Schedule", {
            description: errorMsg,
          })
        }
        setError(errorMsg)
        setLoading(false)
        return
      }

      // Success
      toast.success("Schedule created successfully")
      
      // Reset form
      setSelectedRoute("")
      setTravelDate("")
      setAvailableSeats("")
      setError(null)
      setLoading(false)
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create schedule"
      toast.error("Failed to Create Schedule", {
        description: errorMsg,
      })
      setError(errorMsg)
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Schedule</DialogTitle>
          <DialogDescription>Create a new departure schedule for a route</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="route">Route</Label>
            <Select
              value={selectedRoute}
              onValueChange={setSelectedRoute}
              required
              disabled={loading || routes.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={routes.length === 0 ? "No routes available" : "Select route"} />
              </SelectTrigger>
              <SelectContent>
                {routes.map((route) => (
                  <SelectItem key={route.id} value={route.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {route.from_city} → {route.to_city}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {route.operator_name} • {route.vehicle_type} • {route.departure_time}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {routes.length === 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                ⚠️ No routes available. Please create routes first in the <strong>Routes</strong> tab (which requires operators).
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="travel-date">Travel Date</Label>
              <Input
                id="travel-date"
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                required
                disabled={loading}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seats">Available Seats (Optional)</Label>
              <Input
                id="seats"
                type="number"
                value={availableSeats}
                onChange={(e) => setAvailableSeats(e.target.value)}
                placeholder="Auto (from route)"
                disabled={loading}
                min="1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Schedule"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


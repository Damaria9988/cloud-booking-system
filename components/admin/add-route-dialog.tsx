"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CityAutocomplete } from "./city-autocomplete"
import { TimeInputWithAmPm } from "./time-input-with-ampm"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AddRouteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddRouteDialog({ open, onOpenChange, onSuccess }: AddRouteDialogProps) {
  const [loading, setLoading] = useState(false)
  const [operators, setOperators] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedOperator, setSelectedOperator] = useState<string>("")
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("")
  const [selectedTransportType, setSelectedTransportType] = useState<string>("bus")

  useEffect(() => {
    if (open) {
      fetchOperators()
      setLoading(false)
      setError(null)
      // Reset form fields when dialog opens
      setSelectedOperator("")
      setSelectedVehicleType("")
      setSelectedTransportType("bus")
    }
  }, [open])

  const fetchOperators = async () => {
    try {
      const response = await fetch("/api/admin/operators")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch operators")
      }

      setOperators(data.operators || [])
    } catch (err) {
      console.error("Error fetching operators:", err)
    }
  }

  const parseCityState = (input: string) => {
    const parts = input.split(",").map(s => s.trim())
    if (parts.length >= 3) {
      // Format: "City, State, Country" - properly separate all three
      return { 
        city: parts[0], 
        state: parts[1], 
        country: parts.slice(2).join(", ") // Handle multi-word countries
      }
    } else if (parts.length === 2) {
      // Format: "City, State" or "City, Country" (no state)
      // Try to determine if second part is state or country
      // For now, treat as state (backward compatible)
      return { city: parts[0], state: parts[1], country: "" }
    }
    return { city: parts[0], state: "", country: "" }
  }

  const calculateDuration = (departure: string, arrival: string) => {
    const [depHours, depMins] = departure.split(":").map(Number)
    const [arrHours, arrMins] = arrival.split(":").map(Number)
    
    let totalMinutes = (arrHours * 60 + arrMins) - (depHours * 60 + depMins)
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60 // Next day
    }
    return totalMinutes
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement)
      
      const fromInput = formData.get("from") as string
      const toInput = formData.get("to") as string
      // Use state values for Select components
      const operatorId = parseInt(selectedOperator)
      const vehicleType = selectedVehicleType
      const transportType = selectedTransportType
      const totalSeats = parseInt(formData.get("seats") as string)
      const departureTime = formData.get("departure") as string
      const arrivalTime = formData.get("arrival") as string
      const basePrice = parseFloat(formData.get("price") as string)

      const from = parseCityState(fromInput)
      const to = parseCityState(toInput)
      const durationMinutes = calculateDuration(departureTime, arrivalTime)

      if (!operatorId || !from.city || !to.city || !vehicleType || !transportType || !totalSeats || !departureTime || !arrivalTime || !basePrice) {
        setError("Please fill in all required fields")
        setLoading(false)
        return
      }

      const response = await fetch("/api/admin/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId,
          fromCity: from.city,
          fromState: from.state || "N/A",
          fromCountry: from.country || undefined,
          toCity: to.city,
          toState: to.state || "N/A",
          toCountry: to.country || undefined,
          departureTime,
          arrivalTime,
          durationMinutes,
          vehicleType,
          transportType,
          totalSeats,
          basePrice,
          status: "active",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || "Failed to create route"
        // Show toast for duplicate or other errors
        if (errorMsg.includes("already exists") || errorMsg.includes("duplicate") || errorMsg.includes("Route already exists")) {
          toast.error("Duplicate Route", {
            description: "A route with the same origin, destination, operator, and departure time already exists. Please modify one of these fields.",
          })
        } else {
          toast.error("Failed to Create Route", {
            description: errorMsg,
          })
        }
        setError(errorMsg)
        setLoading(false)
        return
      }

      // Success
      toast.success("Route created successfully", {
        description: data.schedulesCreated ? `Created with ${data.schedulesCreated} schedules` : undefined,
      })
      
      // Reset form
      setSelectedOperator("")
      setSelectedVehicleType("")
      setSelectedTransportType("bus")
      setError(null)
      setLoading(false)
      onOpenChange(false)
      // Trigger refresh events
      window.dispatchEvent(new CustomEvent("admin:refresh-routes"))
      window.dispatchEvent(new CustomEvent("admin:refresh-stats"))
      if (onSuccess) onSuccess()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create route"
      if (errorMsg.includes("already exists") || errorMsg.includes("duplicate") || errorMsg.includes("Route already exists")) {
        toast.error("Duplicate Route", {
          description: "A route with the same origin, destination, operator, and departure time already exists. Please modify one of these fields.",
        })
      } else {
        toast.error("Failed to Create Route", {
          description: errorMsg,
        })
      }
      setError(errorMsg)
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Route</DialogTitle>
          <DialogDescription>Create a new travel route with schedule and pricing details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <CityAutocomplete
              id="from"
              name="from"
              label="From (City, State)"
              placeholder="Start typing city name..."
              required
              disabled={loading}
            />
            <CityAutocomplete
              id="to"
              name="to"
              label="To (City, State)"
              placeholder="Start typing city name..."
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operator">Operator</Label>
              <Select 
                value={selectedOperator} 
                onValueChange={setSelectedOperator}
                required 
                disabled={loading || operators.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={operators.length === 0 ? "No operators available" : "Select operator"} />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.id} value={op.id.toString()}>
                      {op.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {operators.length === 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ No operators available. Please create operators first in the <strong>Operators</strong> tab.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="transportType">Transport Type *</Label>
              <Select 
                value={selectedTransportType} 
                onValueChange={setSelectedTransportType}
                required 
                disabled={loading}
              >
                <SelectTrigger id="transportType" className="w-full">
                  <SelectValue placeholder="Select transport type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bus">Bus</SelectItem>
                  <SelectItem value="train">Train</SelectItem>
                  <SelectItem value="flight">Flight</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Vehicle Type</Label>
              <Select 
                value={selectedVehicleType} 
                onValueChange={setSelectedVehicleType}
                required 
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {/* Bus Types */}
                  <SelectItem value="AC Sleeper">AC Sleeper</SelectItem>
                  <SelectItem value="AC Semi-Sleeper">AC Semi-Sleeper</SelectItem>
                  <SelectItem value="AC Seater">AC Seater</SelectItem>
                  <SelectItem value="AC Express">AC Express</SelectItem>
                  <SelectItem value="Non-AC">Non-AC</SelectItem>
                  <SelectItem value="Express Coach">Express Coach</SelectItem>
                  <SelectItem value="Sleeper Coach">Sleeper Coach</SelectItem>
                  <SelectItem value="Luxury Coach">Luxury Coach</SelectItem>
                  <SelectItem value="VIP Bus">VIP Bus</SelectItem>
                  <SelectItem value="City Bus">City Bus</SelectItem>
                  <SelectItem value="International Coach">International Coach</SelectItem>
                  <SelectItem value="Leito (Sleeper)">Leito (Sleeper)</SelectItem>
                  {/* Train Types */}
                  <SelectItem value="High-Speed Rail">High-Speed Rail</SelectItem>
                  <SelectItem value="TGV High-Speed">TGV High-Speed</SelectItem>
                  <SelectItem value="Thalys High-Speed">Thalys High-Speed</SelectItem>
                  <SelectItem value="ICE High-Speed">ICE High-Speed</SelectItem>
                  <SelectItem value="AVE High-Speed">AVE High-Speed</SelectItem>
                  <SelectItem value="Frecciarossa">Frecciarossa</SelectItem>
                  <SelectItem value="Shinkansen">Shinkansen</SelectItem>
                  <SelectItem value="KTX High-Speed">KTX High-Speed</SelectItem>
                  <SelectItem value="VIA Rail">VIA Rail</SelectItem>
                  <SelectItem value="VIA Rail Express">VIA Rail Express</SelectItem>
                  <SelectItem value="Rocky Mountaineer">Rocky Mountaineer</SelectItem>
                  {/* Flight Types */}
                  <SelectItem value="Boeing 737">Boeing 737</SelectItem>
                  <SelectItem value="Boeing 777">Boeing 777</SelectItem>
                  <SelectItem value="Boeing 787">Boeing 787</SelectItem>
                  <SelectItem value="Airbus A320">Airbus A320</SelectItem>
                  <SelectItem value="Airbus A350">Airbus A350</SelectItem>
                  <SelectItem value="Airbus A380">Airbus A380</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seats">Total Seats</Label>
              <Input id="seats" name="seats" type="number" placeholder="48" required disabled={loading} min="1" className="w-full" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <TimeInputWithAmPm
              id="departure"
              name="departure"
              label="Departure Time"
              required
              disabled={loading}
            />
            <TimeInputWithAmPm
              id="arrival"
              name="arrival"
              label="Arrival Time"
              required
              disabled={loading}
            />
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" name="price" type="number" step="0.01" placeholder="45.00" required disabled={loading} min="0" />
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
                "Add Route"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

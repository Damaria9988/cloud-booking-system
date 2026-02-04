"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export interface SearchFilterOptions {
  minPrice: number
  maxPrice: number
  departureTimeSlots: string[]
  vehicleTypes: string[]
  operators: string[]
  amenities: string[]
}

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilterOptions) => void
  availableOperators?: string[]
}

const TIME_SLOTS = [
  { id: "morning", label: "Morning (6AM-12PM)", start: 6, end: 12 },
  { id: "afternoon", label: "Afternoon (12PM-6PM)", start: 12, end: 18 },
  { id: "evening", label: "Evening (6PM-12AM)", start: 18, end: 24 },
  { id: "night", label: "Night (12AM-6AM)", start: 0, end: 6 },
]

const VEHICLE_TYPES = ["AC", "Non-AC", "Sleeper", "Semi-Sleeper", "Seater"]

const AMENITIES = ["WiFi", "Charging Points", "Water Bottle", "Blanket", "Reading Light", "Snacks"]

export function SearchFilters({ onFiltersChange, availableOperators = [] }: SearchFiltersProps) {
  const [priceRange, setPriceRange] = useState([0, 5000])
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([])
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([])
  const [selectedOperators, setSelectedOperators] = useState<string[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])

  // Notify parent component when filters change
  useEffect(() => {
    onFiltersChange({
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      departureTimeSlots: selectedTimeSlots,
      vehicleTypes: selectedVehicleTypes,
      operators: selectedOperators,
      amenities: selectedAmenities,
    })
  }, [priceRange, selectedTimeSlots, selectedVehicleTypes, selectedOperators, selectedAmenities])

  const handleTimeSlotToggle = (slotId: string) => {
    setSelectedTimeSlots((prev) =>
      prev.includes(slotId) ? prev.filter((s) => s !== slotId) : [...prev, slotId]
    )
  }

  const handleVehicleTypeToggle = (type: string) => {
    setSelectedVehicleTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const handleOperatorToggle = (operator: string) => {
    setSelectedOperators((prev) =>
      prev.includes(operator) ? prev.filter((o) => o !== operator) : [...prev, operator]
    )
  }

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    )
  }

  const handleClearFilters = () => {
    setPriceRange([0, 5000])
    setSelectedTimeSlots([])
    setSelectedVehicleTypes([])
    setSelectedOperators([])
    setSelectedAmenities([])
  }

  const activeFiltersCount =
    selectedTimeSlots.length +
    selectedVehicleTypes.length +
    selectedOperators.length +
    selectedAmenities.length +
    (priceRange[0] > 0 || priceRange[1] < 5000 ? 1 : 0)

  return (
    <Card className="sticky top-20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Filters</CardTitle>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-8 px-2 text-xs">
            Clear ({activeFiltersCount})
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Range */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Price Range</Label>
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={5000}
            min={0}
            step={100}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>

        <Separator />

        {/* Departure Time */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Departure Time</Label>
          <div className="space-y-2">
            {TIME_SLOTS.map((slot) => (
              <div key={slot.id} className="flex items-center space-x-2">
                <Checkbox
                  id={slot.id}
                  checked={selectedTimeSlots.includes(slot.id)}
                  onCheckedChange={() => handleTimeSlotToggle(slot.id)}
                />
                <label htmlFor={slot.id} className="text-sm cursor-pointer">
                  {slot.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Vehicle Type */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Vehicle Type</Label>
          <div className="space-y-2">
            {VEHICLE_TYPES.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`vehicle-${type}`}
                  checked={selectedVehicleTypes.includes(type)}
                  onCheckedChange={() => handleVehicleTypeToggle(type)}
                />
                <label htmlFor={`vehicle-${type}`} className="text-sm cursor-pointer">
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Operators */}
        {availableOperators.length > 0 && (
          <>
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Operators</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableOperators.map((operator) => (
                  <div key={operator} className="flex items-center space-x-2">
                    <Checkbox
                      id={`operator-${operator}`}
                      checked={selectedOperators.includes(operator)}
                      onCheckedChange={() => handleOperatorToggle(operator)}
                    />
                    <label htmlFor={`operator-${operator}`} className="text-sm cursor-pointer">
                      {operator}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Amenities */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Amenities</Label>
          <div className="space-y-2">
            {AMENITIES.map((amenity) => (
              <div key={amenity} className="flex items-center space-x-2">
                <Checkbox
                  id={`amenity-${amenity}`}
                  checked={selectedAmenities.includes(amenity)}
                  onCheckedChange={() => handleAmenityToggle(amenity)}
                />
                <label htmlFor={`amenity-${amenity}`} className="text-sm cursor-pointer">
                  {amenity}
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

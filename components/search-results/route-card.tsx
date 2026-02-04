/**
 * RouteCard Component
 * Displays a single route/trip card with all details
 */

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Star, Users, Zap, Bus, Train, Plane, Loader2, CalendarDays } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export interface RouteCardProps {
  trip: {
    id: number
    operator: string
    rating: number
    reviews: number
    fromCity: string
    fromState?: string
    fromCountry?: string
    toCity: string
    toState?: string
    toCountry?: string
    departureTime: string
    arrivalTime: string
    duration: string
    vehicleType: string
    transportType?: string
    basePrice: number
    amenities: string[]
    availableSeats: number
    totalSeats: number
    travelDate?: string
    scheduleId?: number
  }
  isReturn?: boolean
  mode: string
  from: string
  to: string
  date: string
  returnDate?: string
  tripType?: "one-way" | "round-trip"
  adults: number
  children: number
  infants: number
  navigatingTo?: number | null
  onNavigate?: (tripId: number) => void
}

export function RouteCard({
  trip,
  isReturn = false,
  mode,
  from,
  to,
  date,
  returnDate = "",
  tripType = "one-way",
  adults,
  children,
  infants,
  navigatingTo,
  onNavigate,
}: RouteCardProps) {
  const router = useRouter()
  const price = trip.basePrice
  const seatsAvailable = trip.availableSeats || 0
  const featured = seatsAvailable < 10 // Mark as featured if low availability
  
  // Get the route's actual travel date from the API
  const displayDate = trip.travelDate
  
  // Format date for display
  const formatDisplayDate = (dateStr: string | undefined) => {
    if (!dateStr) return null
    try {
      const dateObj = new Date(dateStr)
      if (isNaN(dateObj.getTime())) return null
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return null
    }
  }
  
  const formattedDate = formatDisplayDate(displayDate)

  const handleSelectSeats = async () => {
    if (seatsAvailable === 0) return
    
    if (onNavigate) {
      onNavigate(trip.id)
    }
    
    // Get scheduleId - if not available, fetch it from route details API
    let scheduleId = trip.scheduleId
    // IMPORTANT: Prioritize user's searched date over API-returned travelDate
    let tripDate = isReturn ? returnDate : (date || trip.travelDate)
    
    if (!scheduleId && tripDate) {
      try {
        // Fetch route with date to get the matching schedule
        const routeRes = await fetch(`/api/routes/${trip.id}?date=${encodeURIComponent(tripDate)}`)
        if (routeRes.ok) {
          const routeData = await routeRes.json()
          if (routeData.route?.scheduleId) {
            scheduleId = routeData.route.scheduleId
            // Keep user's searched date, don't overwrite
          }
        }
      } catch (e) {
        // Ignore errors, seats page will resolve it
      }
    }
    
    const tripFrom = isReturn ? to : from
    const tripTo = isReturn ? from : to
    
    // Ensure the user's selected date is always in the URL
    const finalDate = tripDate || ""
    const seatUrl = `/seats/${trip.id}?mode=${mode}&from=${encodeURIComponent(tripFrom)}&to=${encodeURIComponent(tripTo)}&date=${encodeURIComponent(finalDate)}&scheduleId=${scheduleId || ""}&adults=${adults}&children=${children}&infants=${infants}${tripType === "round-trip" ? `&tripType=round-trip&returnDate=${encodeURIComponent(returnDate || "")}&isReturn=${isReturn ? "1" : "0"}` : ""}`
    
    try {
      // Only navigate if router is ready (client-side only)
      if (typeof window !== 'undefined' && router) {
        // Prefetch the route first for instant navigation
        try {
          router.prefetch(seatUrl)
        } catch (prefetchErr) {
          // Silently handle prefetch errors
        }
        // Navigate
        router.push(seatUrl)
      }
    } catch (error) {
      console.error("Navigation error:", error)
    }
  }

  const handleMouseEnter = () => {
    // Aggressively prefetch on hover for instant navigation
    if (typeof window !== 'undefined' && router) {
      try {
        const tripFrom = isReturn ? to : from
        const tripTo = isReturn ? from : to
        // IMPORTANT: Prioritize user's searched date over API-returned travelDate
        const tripDate = isReturn ? returnDate : (date || trip.travelDate)
        const finalDate = tripDate || ""
        const seatUrl = `/seats/${trip.id}?mode=${mode}&from=${encodeURIComponent(tripFrom)}&to=${encodeURIComponent(tripTo)}&date=${encodeURIComponent(finalDate)}&scheduleId=${trip.scheduleId || ""}&adults=${adults}&children=${children}&infants=${infants}${tripType === "round-trip" ? `&tripType=round-trip&returnDate=${encodeURIComponent(returnDate || "")}&isReturn=${isReturn ? "1" : "0"}` : ""}`
        router.prefetch(seatUrl)
      } catch (err) {
        // Silently handle prefetch errors
      }
    }
    
    // Prefetch API data in background
    if (trip.id) {
      fetch(`/api/routes/${trip.id}`).then(res => res.json()).then(data => {
        if (typeof window !== 'undefined' && data.route) {
          try {
            sessionStorage.setItem(`route-${trip.id}`, JSON.stringify(data.route))
          } catch (e) {
            // Storage quota exceeded, ignore
          }
        }
      }).catch(() => {
        // Ignore prefetch errors
      })
      
      // Also prefetch seat availability
      if (trip.scheduleId) {
        fetch(`/api/routes/${trip.id}/seats?scheduleId=${trip.scheduleId}`).catch(() => {
          // Ignore errors
        })
      }
    }
  }

  const getTransportIcon = () => {
    switch (trip.transportType || mode) {
      case "bus":
        return <Bus className="h-3 w-3 mr-1" />
      case "train":
        return <Train className="h-3 w-3 mr-1" />
      case "flight":
        return <Plane className="h-3 w-3 mr-1" />
      default:
        return <Bus className="h-3 w-3 mr-1" />
    }
  }

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-lg ${featured ? "border-accent border-2" : ""}`}
    >
      {featured && (
        <div className="bg-accent text-accent-foreground px-4 py-1.5 text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Limited Seats Available
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Trip Info */}
          <div className="flex-1 space-y-4">
            {/* Operator Info */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg">{trip.operator}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {trip.vehicleType}
                  </Badge>
                  {trip.transportType && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {getTransportIcon()}
                      {trip.transportType}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{trip.rating?.toFixed(1) || "N/A"}</span>
                    <span className="text-muted-foreground">({trip.reviews || 0})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Time and Duration */}
            <div className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-bold">{trip.departureTime}</div>
                <div className="text-sm text-muted-foreground">
                  {trip.fromCity || from || "Origin"}
                  {trip.fromState && `, ${trip.fromState}`}
                  {trip.fromCountry && `, ${trip.fromCountry}`}
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  {trip.duration}
                </div>
                <div className="w-full h-px bg-border relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent" />
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold">{trip.arrivalTime}</div>
                <div className="text-sm text-muted-foreground">
                  {trip.toCity || to || "Destination"}
                  {trip.toState && `, ${trip.toState}`}
                  {trip.toCountry && `, ${trip.toCountry}`}
                </div>
              </div>
            </div>

            {/* Seats Available */}
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className={seatsAvailable < 10 ? "text-destructive font-medium" : "text-muted-foreground"}>
                {seatsAvailable} seats available
              </span>
            </div>

            {/* Travel Date */}
            {formattedDate && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">{formattedDate}</span>
              </div>
            )}
          </div>

          {/* Right: Price and Action */}
          <div className="lg:w-48 flex flex-col items-end justify-between gap-4 lg:border-l lg:pl-6">
            <div className="text-right w-full">
              <div className="flex items-center justify-end gap-2">
                <div className="text-3xl font-bold text-primary">${price.toFixed(2)}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">per person</div>
            </div>

            <Button
              className="w-full bg-accent hover:bg-accent/90"
              size="lg"
              disabled={seatsAvailable === 0 || navigatingTo === trip.id}
              onClick={handleSelectSeats}
              onMouseEnter={handleMouseEnter}
            >
              {navigatingTo === trip.id ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Selecting seat...
                </>
              ) : seatsAvailable === 0 ? (
                "Sold Out"
              ) : (
                "Select Seats"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

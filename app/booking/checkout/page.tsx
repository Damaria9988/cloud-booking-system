"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CheckoutForm } from "@/components/checkout-form"
import { CheckoutSummary } from "@/components/checkout-summary"
import { Shield, Lock, CreditCard, ArrowLeft } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, useMemo, Suspense, useRef } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [route, setRoute] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false) // Prevent duplicate fetches
  
  // Memoize search params to prevent unnecessary re-renders
  const bookingParams = useMemo(() => {
    const seatsParam = searchParams.get("seats") || ""
    return {
      seats: seatsParam ? seatsParam.split(",") : [],
      routeId: searchParams.get("routeId"),
      scheduleId: searchParams.get("scheduleId") || "",
      pricePerSeat: parseFloat(searchParams.get("pricePerSeat") || "45"),
      from: searchParams.get("from") || "",
      to: searchParams.get("to") || "",
      date: searchParams.get("date") || "",
      operator: searchParams.get("operator") || "",
      promoCode: searchParams.get("promoCode") || "",
    }
  }, [searchParams])
  
  // Get seats from URL parameters
  const seats = bookingParams.seats
  const routeId = bookingParams.routeId
  const scheduleId = bookingParams.scheduleId
  const pricePerSeat = bookingParams.pricePerSeat
  const from = bookingParams.from
  const to = bookingParams.to
  const date = bookingParams.date
  const operator = bookingParams.operator
  const promoCode = bookingParams.promoCode

  useEffect(() => {
    const fetchRoute = async () => {
      // Prevent duplicate simultaneous requests
      if (fetchingRef.current) {
        return
      }
      
      if (!routeId) {
        setError("Route ID is missing")
        setLoading(false)
        return
      }

      fetchingRef.current = true

      try {
        const routeIdNum = typeof routeId === 'string' ? parseInt(routeId, 10) : Number(routeId)
        
        const response = await fetch(`/api/routes/${routeIdNum}`, {
          cache: 'force-cache', // Use cache to prevent unnecessary requests
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch route")
        }

        // Format time
        const formatTime = (time: string) => {
          if (!time) return ""
          try {
            const [hours, minutes] = time.split(":")
            const hour = parseInt(hours)
            if (isNaN(hour)) return time
            const ampm = hour >= 12 ? "PM" : "AM"
            const displayHour = hour % 12 || 12
            return `${displayHour}:${minutes} ${ampm}`
          } catch {
            return time
          }
        }

        let fetchedScheduleId = scheduleId

        // If scheduleId is missing, try to fetch it from schedules
        if (!scheduleId || scheduleId === "") {
          console.log("🔍 scheduleId missing, attempting to fetch from schedules API...")
          console.log("   Route ID:", routeIdNum, "Date from URL:", date)
          
          try {
            // Format date properly for API (YYYY-MM-DD format)
            let formattedDate = date || ""
            if (formattedDate) {
              // Handle different date formats (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.)
              try {
                // Try parsing as US format first (MM/DD/YYYY)
                const parts = formattedDate.split('/')
                let dateObj: Date
                
                if (parts.length === 3) {
                  // Assume MM/DD/YYYY format (US format)
                  const month = parseInt(parts[0], 10) - 1 // Month is 0-indexed
                  const day = parseInt(parts[1], 10)
                  const year = parseInt(parts[2], 10)
                  dateObj = new Date(year, month, day)
                } else {
                  // Try standard Date parsing
                  dateObj = new Date(formattedDate)
                }
                
                if (!isNaN(dateObj.getTime())) {
                  // Format as YYYY-MM-DD
                  const year = dateObj.getFullYear()
                  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
                  const day = String(dateObj.getDate()).padStart(2, '0')
                  formattedDate = `${year}-${month}-${day}`
                  console.log("   Converted date to:", formattedDate)
                } else {
                  console.warn("   Could not parse date:", formattedDate)
                }
              } catch (parseError) {
                console.warn("   Date parsing error:", parseError)
                // Keep original format if parsing fails
              }
            }
            
            // Try with the specific date first
            let schedulesUrl = `/api/routes/${routeIdNum}/schedules${formattedDate ? `?date=${encodeURIComponent(formattedDate)}` : ""}`
            console.log("   Fetching from:", schedulesUrl)
            
            let schedulesResponse = await fetch(schedulesUrl)
            let schedulesData = await schedulesResponse.json()
            
            console.log("   Schedules response:", schedulesData)
            
            // If no schedules found for specific date, try without date filter to get any schedule for this route
            if (!schedulesData.schedules || schedulesData.schedules.length === 0) {
              console.log("   No schedules for specific date, trying without date filter...")
              schedulesUrl = `/api/routes/${routeIdNum}/schedules`
              schedulesResponse = await fetch(schedulesUrl)
              schedulesData = await schedulesResponse.json()
              console.log("   Schedules (any date) response:", schedulesData)
            }
            
            if (schedulesData.schedules && schedulesData.schedules.length > 0) {
              // Use the first available schedule
              fetchedScheduleId = schedulesData.schedules[0].id.toString()
              console.log("✅ Successfully fetched scheduleId:", fetchedScheduleId)
            } else {
              console.warn("⚠️ No schedules found for route", routeIdNum, "on date", formattedDate || "any date")
              // Set error message for user
              setError(`No schedules available for this route on ${date || "the selected date"}. Please select a different date or route.`)
            }
          } catch (scheduleError) {
            console.error("❌ Error fetching scheduleId from schedules:", scheduleError)
            setError("Unable to fetch schedule information. Please try again.")
            // Continue without scheduleId - validation will catch it
          }
        } else {
          console.log("✅ Using scheduleId from URL:", scheduleId)
        }

        setRoute({
          ...data.route,
          departureTime: formatTime(data.route.departureTime),
          arrivalTime: formatTime(data.route.arrivalTime),
          scheduleId: fetchedScheduleId || "", // Store fetched scheduleId in route object
        })
        
        console.log("📦 Route set with scheduleId:", fetchedScheduleId || "NONE")
      } catch (err) {
        console.error("Error fetching route:", err)
        setError(err instanceof Error ? err.message : "Failed to load route")
      } finally {
        setLoading(false)
        fetchingRef.current = false
      }
    }

    fetchRoute()
  }, [routeId, scheduleId, date])

  // Debug: Log when route changes to verify scheduleId
  useEffect(() => {
    if (route) {
      const routeScheduleId = (route as any).scheduleId
      console.log("🔍 Route updated:", {
        routeId: route.id,
        scheduleIdInRoute: routeScheduleId,
        scheduleIdFromURL: scheduleId,
        willUse: routeScheduleId || scheduleId || "NONE"
      })
    }
  }, [route, scheduleId])
  
  // Debug: Log bookingData when it changes
  useEffect(() => {
    if (route) {
      const bookingDataDebug = {
        routeId: typeof route.id === 'string' ? parseInt(route.id, 10) : route.id,
        scheduleId: (route as any).scheduleId || scheduleId || "",
        travelDate: date,
        seats: seats
      }
      console.log("📋 BookingData will use:", bookingDataDebug)
    }
  }, [route, scheduleId, date, seats])

  // Memoize bookingData BEFORE early returns to follow Rules of Hooks
  // Handle null route case safely
  const bookingData = useMemo(() => {
    // Convert routeId to number, ensuring it's valid
    const routeIdNum = routeId 
      ? (() => {
          const parsed = typeof routeId === 'string' ? parseInt(routeId, 10) : Number(routeId)
          return isNaN(parsed) ? undefined : parsed
        })()
      : undefined
    
    if (!route) {
      return {
        trip: {
          operator: operator || "",
          from: from || "",
          to: to || "",
          departureTime: "",
          arrivalTime: "",
          date: date || new Date().toLocaleDateString(),
          duration: "",
          type: "",
        },
        seats: seats,
        pricePerSeat: pricePerSeat,
        discount: 0,
        // tax: pricePerSeat * seats.length * 0.08, // Tax calculation commented out
        tax: 0, // Taxes disabled
        routeId: routeIdNum,
        scheduleId: scheduleId,
        travelDate: date,
      }
    }
    
    // Ensure route.id is a number
    const routeIdFromRoute = typeof route.id === 'string' 
      ? (() => {
          const parsed = parseInt(route.id, 10)
          return isNaN(parsed) ? undefined : parsed
        })()
      : (isNaN(Number(route.id)) ? undefined : route.id)
    
    const finalScheduleId = (route as any).scheduleId || scheduleId || ""
    
    console.log("📦 Creating bookingData with:", {
      routeId: routeIdFromRoute,
      scheduleId: finalScheduleId,
      scheduleIdFromRoute: (route as any).scheduleId,
      scheduleIdFromURL: scheduleId,
      travelDate: date
    })
    
    return {
      trip: {
        operator: route.operator || operator,
        from: from || route.fromCity,
        to: to || route.toCity,
        departureTime: route.departureTime,
        arrivalTime: route.arrivalTime,
        date: date || new Date().toLocaleDateString(),
        duration: route.duration,
        type: route.vehicleType,
      },
      seats: seats,
      pricePerSeat: route.basePrice || pricePerSeat,
      discount: 0, // Will be calculated based on promo code
      
      // tax: (route.basePrice || pricePerSeat) * seats.length * 0.08, // 8% tax - Commented out
      tax: 0, // Taxes disabled
      routeId: routeIdFromRoute,
      scheduleId: finalScheduleId, // Use scheduleId from route if available, fallback to URL param
      travelDate: date,
    }
  }, [route, operator, from, to, date, seats, pricePerSeat, scheduleId, routeId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading checkout...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !route) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive text-lg mb-2">{error || "Route not found"}</p>
            <p className="text-muted-foreground">Please go back and try again.</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // If no seats selected, show message
  if (seats.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 py-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-4">No seats selected</p>
            <p className="text-sm text-muted-foreground">Please go back and select your seats first.</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Build seat selection URL with current params
                const params = new URLSearchParams()
                if (routeId) params.set("routeId", routeId.toString())
                if (scheduleId) params.set("scheduleId", scheduleId)
                if (from) params.set("from", from)
                if (to) params.set("to", to)
                if (date) params.set("date", date)
                if (seats.length > 0) params.set("seats", seats.join(","))
                if (pricePerSeat) params.set("pricePerSeat", pricePerSeat.toString())
                router.push(`/seats/${routeId}?${params.toString()}`)
              }}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Seat Selection
            </Button>
          </div>
          {/* Trust Indicators */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <span>256-bit SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <span>PCI DSS Compliant</span>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CheckoutForm bookingData={bookingData} />
            </div>

            <div className="lg:col-span-1">
              <CheckoutSummary bookingData={bookingData} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading checkout...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}

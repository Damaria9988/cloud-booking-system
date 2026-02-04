"use client"

// edit

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SeatSelectorBus } from "@/components/seat-selector-bus"
import { SeatSelectorTrain } from "@/components/seat-selector-train"
import { SeatSelectorFlight } from "@/components/seat-selector-flight"
import { TripDetails } from "@/components/trip-details"
import { BookingSummary } from "@/components/booking-summary"
import { useState, use, useEffect, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, ArrowLeft } from "lucide-react"
import { useSocketIO, type SocketIOMessage } from "@/hooks/use-socketio"
import { Button } from "@/components/ui/button"

interface Route {
  id: number
  operator: string
  fromCity: string
  fromState?: string
  fromCountry?: string
  toCity: string
  toState?: string
  toCountry?: string
  departureTime: string
  arrivalTime: string
  duration: string
  basePrice: number
  totalSeats: number
  vehicleType: string
  transportType?: string
  amenities: string[]
}

export default function SeatsPage({ params }: { params: Promise<{ id: string }> }) {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL IN CONSISTENT ORDER
  // Step 1: Next.js navigation hooks (must be called first)
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Step 2: All useState hooks (must be grouped together BEFORE use(params))
  // DO NOT call searchParams.get() inside useState - extract values after all hooks
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [route, setRoute] = useState<Route | null>(null)
  const [bookedSeats, setBookedSeats] = useState<string[]>([])
  const [seatsSelectedByOthers, setSeatsSelectedByOthers] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<string>("bus") // Default value, will be updated from searchParams after hooks
  const [resolvedScheduleId, setResolvedScheduleId] = useState<string | null>(null)
  
  // Step 3: All useRef hooks (must be grouped together after useState)
  const fetchingRef = useRef(false) // Prevent duplicate simultaneous requests
  const socketClientIdRef = useRef<string | null>(null) // Store socketClientId for use in callbacks
  const selectedSeatsRef = useRef<string[]>([]) // Track selectedSeats for use in callbacks
  const bookedSeatsRef = useRef<string[]>([]) // Track booked seats to prevent unnecessary updates
  
  // Step 4: Next.js params hook (must be called after useState and useRef)
  const resolvedParams = use(params)
  
  // Step 5: Custom hooks (useSocketIO uses useState, useRef, useCallback, useEffect internally)
  // MUST be called AFTER all basic hooks to maintain consistent hook order
  // Always call useSocketIO unconditionally - handle connection logic in useEffect
  const { send, clientId: socketClientId, isConnected: socketConnected, subscribe, unsubscribe, lastMessage, connect: connectSocket, disconnect: disconnectSocket } = useSocketIO({
    autoConnect: false, // Always start with false, enable in useEffect
    autoReconnect: false, // Always start with false, enable in useEffect
    onMessage: undefined, // Will handle messages via lastMessage in useEffect
    showToastNotifications: false,
  })
  
  // Step 6: Extract ALL values from searchParams (non-hook code, safe to call after all hooks)
  // Extract ALL searchParams values here to avoid calling searchParams.get() inside useState
  const from = searchParams.get("from") || ""
  const to = searchParams.get("to") || ""
  const date = searchParams.get("date") || ""
  const scheduleId = searchParams.get("scheduleId") || ""
  const modeParam = searchParams.get("mode") || "bus"
  const passengersParam = searchParams.get("passengers")
  const adultsParam = searchParams.get("adults")
  const childrenParam = searchParams.get("children")
  const infantsParam = searchParams.get("infants")
  
  // Calculate derived values after all hooks are called
  const scheduleIdNum = resolvedScheduleId ? parseInt(resolvedScheduleId) : (scheduleId ? parseInt(scheduleId) : null)
  const totalPassengers = passengersParam 
    ? parseInt(passengersParam) 
    : (parseInt(adultsParam || "1") + parseInt(childrenParam || "0") + parseInt(infantsParam || "0"))
  
  // Step 7: ALL useCallback hooks (must be grouped together and called BEFORE useEffect)
  // Handle seat update messages from Socket.IO
  const handleSeatUpdateMessage = useCallback((message: SocketIOMessage) => {
    console.log(`[SEATS PAGE WS] Received message:`, message.type, message.data)
    if (message.type === 'seat_update' && message.data.scheduleId === scheduleIdNum) {
      const newBookedSeats = message.data.bookedSeats || []
      console.log(`[SEATS PAGE WS] seat_update for scheduleId ${scheduleIdNum}, bookedSeats:`, newBookedSeats)
      // API now returns seats in UI format (e.g., "A3", "B3", "A4")
      // No conversion needed - use them directly
      
      // Only update if the data actually changed (deep comparison)
      const currentBooked = bookedSeatsRef.current
      const hasChanged = (
        currentBooked.length !== newBookedSeats.length ||
        !currentBooked.every((seat, idx) => seat === newBookedSeats[idx])
      )
      
      if (hasChanged) {
        console.log(`[SEATS PAGE WS] Updating bookedSeats from`, currentBooked, `to`, newBookedSeats)
        bookedSeatsRef.current = newBookedSeats
        setBookedSeats(newBookedSeats)
      } else {
        console.log(`[SEATS PAGE WS] No change in bookedSeats, skipping update`)
      }
    }
  }, [scheduleIdNum])

  // Socket.IO message handler - use useCallback to ensure stable reference
  // Use ref to access socketClientId to avoid dependency issues
  const handleSeatSelectionMessage = useCallback((message: SocketIOMessage) => {
    if (message.type === 'seat_selection' && message.data.scheduleId === scheduleIdNum) {
      const { selectedSeats: otherUserSeats, clientId: otherClientId } = message.data
      
      // Get current socketClientId from ref
      const currentClientId = socketClientIdRef.current
      
      // Don't process our own selections
      if (otherClientId === currentClientId) {
        return
      }

      // Update seats selected by others
      // Visuals will persist until the user completes or cancels their booking
      setSeatsSelectedByOthers((prev: Set<string>) => {
        const newSet = new Set(prev)
        // Remove seats that are no longer selected
        prev.forEach((seat: string) => {
          if (!otherUserSeats.includes(seat)) {
            newSet.delete(seat)
          }
        })
        // Add newly selected seats (excluding our own selections)
        otherUserSeats.forEach((seat: string) => {
          // Use a ref to get current selectedSeats to avoid stale closure
          const currentSelected = selectedSeatsRef.current
          if (!currentSelected.includes(seat)) {
            newSet.add(seat)
          }
        })
        return newSet
      })
    }
  }, [scheduleIdNum])
  
  // Step 8: ALL useEffect hooks (must be grouped together and called AFTER useCallback)
  // Update mode state from searchParams (use useEffect to avoid calling searchParams.get() in useState)
  useEffect(() => {
    if (modeParam && modeParam !== mode) {
      setMode(modeParam)
    }
  }, [modeParam, mode])
  
  // Update resolvedScheduleId from scheduleId in URL
  useEffect(() => {
    if (scheduleId && scheduleId !== resolvedScheduleId) {
      setResolvedScheduleId(scheduleId)
    }
  }, [scheduleId, resolvedScheduleId])
  
  // Handle Socket.IO messages via lastMessage to maintain hook order
  useEffect(() => {
    if (!lastMessage) return
    
    console.log(`[SEATS PAGE WS] Processing lastMessage:`, lastMessage.type)
    
    // Handle seat update messages
    handleSeatUpdateMessage(lastMessage)
    
    // Handle seat selection messages
    handleSeatSelectionMessage(lastMessage)
  }, [lastMessage, handleSeatUpdateMessage, handleSeatSelectionMessage])
  
  // Update ref when selectedSeats changes
  useEffect(() => {
    selectedSeatsRef.current = selectedSeats
  }, [selectedSeats])

  // Update ref when socketClientId changes
  useEffect(() => {
    socketClientIdRef.current = socketClientId
  }, [socketClientId])

  // Manually connect/disconnect socket based on scheduleIdNum
  useEffect(() => {
    if (scheduleIdNum !== null) {
      connectSocket()
    } else {
      disconnectSocket()
    }
  }, [scheduleIdNum, connectSocket, disconnectSocket])

  // Subscribe to schedule channel for seat selections
  useEffect(() => {
    if (scheduleIdNum && socketConnected) {
      const channel = `schedule:${scheduleIdNum}`
      console.log(`[SEATS PAGE WS] Subscribing to channel: ${channel}`)
      subscribe(channel)
      return () => {
        console.log(`[SEATS PAGE WS] Unsubscribing from channel: ${channel}`)
        unsubscribe(channel)
      }
    }
  }, [scheduleIdNum, socketConnected, subscribe, unsubscribe])

  // Broadcast seat selections when they change
  useEffect(() => {
    if (scheduleIdNum && socketConnected && socketClientId) {
      // Debounce broadcasts to avoid too many messages
      const timeoutId = setTimeout(() => {
        send({
          type: 'seat_selection',
          data: {
            scheduleId: scheduleIdNum,
            selectedSeats: selectedSeats,
            clientId: socketClientId,
          },
        })
      }, 300) // 300ms debounce

      return () => clearTimeout(timeoutId)
    }
  }, [selectedSeats, scheduleIdNum, socketConnected, socketClientId, send])

  // Periodic seat availability refresh - ensures booked seats are always current
  // This catches any missed WebSocket updates
  useEffect(() => {
    if (!scheduleIdNum || !resolvedParams.id) return

    const refreshSeats = async () => {
      try {
        const routeId = parseInt(resolvedParams.id)
        const response = await fetch(`/api/routes/${routeId}/seats?scheduleId=${scheduleIdNum}&_t=${Date.now()}`, {
          cache: 'no-store',
        })
        if (response.ok) {
          const seatsData = await response.json()
          if (seatsData.bookedSeats && Array.isArray(seatsData.bookedSeats)) {
            const currentBooked = bookedSeatsRef.current
            const newBooked = seatsData.bookedSeats
            // Only update if actually changed
            const hasChanged = (
              currentBooked.length !== newBooked.length ||
              !currentBooked.every((seat: string) => newBooked.includes(seat)) ||
              !newBooked.every((seat: string) => currentBooked.includes(seat))
            )
            if (hasChanged) {
              console.log(`[SEATS PAGE POLL] Updating bookedSeats from`, currentBooked, `to`, newBooked)
              bookedSeatsRef.current = newBooked
              setBookedSeats(newBooked)
            }
          }
        }
      } catch (err) {
        // Silently ignore polling errors
      }
    }

    // Refresh every 5 seconds
    const intervalId = setInterval(refreshSeats, 5000)

    return () => clearInterval(intervalId)
  }, [scheduleIdNum, resolvedParams.id])

  // Fetch route and seat data (last useEffect - all useEffect hooks grouped together)
  useEffect(() => {
    const fetchData = async () => {
      // Prevent duplicate simultaneous requests
      if (fetchingRef.current) {
        return
      }
      fetchingRef.current = true

      try {
        const routeId = parseInt(resolvedParams.id)
        
        if (isNaN(routeId)) {
          throw new Error("Invalid route ID")
        }

        // Check cache first for instant loading
        const cacheKey = `route-${routeId}`
        const cachedRoute = typeof window !== 'undefined' ? sessionStorage.getItem(cacheKey) : null
        
        if (cachedRoute) {
          try {
            const parsedRoute = JSON.parse(cachedRoute)
            // Show cached data immediately without waiting for API
            setRoute(parsedRoute)
            if (parsedRoute.transportType) {
              setMode(parsedRoute.transportType)
            }
            // Don't set loading to false yet - let API update in background
          } catch (e) {
            // Invalid cache, continue to fetch
          }
        }

          // Fetch route and seat availability in parallel for faster loading
          // Use cache: 'force-cache' for route data (changes infrequently)
          // Use cache: 'no-store' for seat data (needs to be fresh)
          
          console.log(`[SEATS PAGE] Starting fetch - routeId: ${routeId}, scheduleId from URL: ${scheduleId}`)
          
          // If scheduleId is missing, try to fetch scheduleId from schedules API
          let resolvedScheduleId = scheduleId
          if (!resolvedScheduleId) {
            try {
              
              // Format date to YYYY-MM-DD if provided
              let formattedDate: string | null = date ? date : null
              if (date && date.includes('/')) {
                // Handle MM/DD/YYYY or DD/MM/YYYY format
                const parts = date.split('/')
                if (parts.length === 3) {
                  // Try MM/DD/YYYY first (US format)
                  const month = parseInt(parts[0], 10) - 1
                  const day = parseInt(parts[1], 10)
                  const year = parseInt(parts[2], 10)
                  const dateObj = new Date(year, month, day)
                  if (!isNaN(dateObj.getTime())) {
                    const y = dateObj.getFullYear()
                    const m = String(dateObj.getMonth() + 1).padStart(2, '0')
                    const d = String(dateObj.getDate()).padStart(2, '0')
                    formattedDate = `${y}-${m}-${d}`
                  } else {
                    formattedDate = null
                  }
                }
              }
              
              // Build schedules URL - include date if available, otherwise get all schedules
              const schedulesUrl = formattedDate 
                ? `/api/routes/${routeId}/schedules?date=${formattedDate}`
                : `/api/routes/${routeId}/schedules`
              const schedulesResponse = await fetch(schedulesUrl)
              
              if (schedulesResponse.ok) {
                const schedulesData = await schedulesResponse.json()
                
                if (schedulesData.schedules && schedulesData.schedules.length > 0) {
                  // If date was provided, get the first schedule for that date
                  // Otherwise, get the first upcoming schedule
                  const schedule = formattedDate 
                    ? schedulesData.schedules[0]
                    : schedulesData.schedules.find((s: any) => new Date(s.travelDate) >= new Date()) || schedulesData.schedules[0]
                  
                  if (schedule) {
                    resolvedScheduleId = schedule.id.toString()
                  }
                }
              }
            } catch (scheduleErr) {
              // Silently handle schedule fetch errors
            }
          }
          
          const [routeResponse, seatsResponse] = await Promise.allSettled([
            fetch(`/api/routes/${routeId}`, {
              cache: 'no-store', // Always fetch fresh route data to avoid stale errors
            }),
            resolvedScheduleId ? fetch(`/api/routes/${routeId}/seats?scheduleId=${resolvedScheduleId}`, {
              cache: 'no-store', // Always fetch fresh seat data
            }) : Promise.resolve(null)
          ])
          
          console.log(`[SEATS PAGE] Resolved scheduleId: ${resolvedScheduleId}`)
          if (!resolvedScheduleId) {
            console.log(`[SEATS PAGE] WARNING: No scheduleId available!`)
          } else if (resolvedScheduleId !== scheduleId) {
            // Update state so Socket.IO can use it
            console.log(`[SEATS PAGE] Updating state scheduleId from ${scheduleId} to ${resolvedScheduleId}`)
            setResolvedScheduleId(resolvedScheduleId)
          } else if (resolvedScheduleId) {
            // Ensure state is set even if it matches
            setResolvedScheduleId(resolvedScheduleId)
          }

        // Handle route data
        let routeData: Route | null = null
        if (routeResponse.status === 'fulfilled' && routeResponse.value.ok) {
          const data = await routeResponse.value.json()

          // Format time
          const formatTime = (time: string) => {
            if (!time) return ""
            const [hours, minutes] = time.split(":")
            const hour = parseInt(hours)
            const ampm = hour >= 12 ? "PM" : "AM"
            const displayHour = hour % 12 || 12
            return `${displayHour}:${minutes} ${ampm}`
          }

          routeData = {
            ...data.route,
            departureTime: formatTime(data.route.departureTime),
            arrivalTime: formatTime(data.route.arrivalTime),
          }
          setRoute(routeData)
          
          // Cache route data for faster subsequent loads
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify(routeData))
            } catch (e) {
              // Storage quota exceeded or disabled, ignore
            }
          }
          
          // Update mode based on route's transport type
          if (routeData && routeData.transportType) {
            setMode(routeData.transportType)
          }
        } else {
          const errorData = routeResponse.status === 'fulfilled' 
            ? await routeResponse.value.json() 
            : { error: "Failed to fetch route" }
          throw new Error(errorData.error || "Failed to fetch route")
        }

        // Handle seat availability (non-blocking - continue even if it fails)
        if (seatsResponse.status === 'fulfilled' && seatsResponse.value) {
          try {
            const seatsData = await seatsResponse.value.json()
            console.log(`[SEATS PAGE] Received seat data for scheduleId ${resolvedScheduleId}:`, seatsData)
            if (seatsData.bookedSeats && Array.isArray(seatsData.bookedSeats)) {
              // API now returns seats in UI format (e.g., "A3", "B3", "A4")
              // No conversion needed - use them directly
              console.log(`[SEATS PAGE] Setting bookedSeats to:`, seatsData.bookedSeats)
              setBookedSeats(seatsData.bookedSeats)
              bookedSeatsRef.current = seatsData.bookedSeats
            } else {
              console.log(`[SEATS PAGE] No bookedSeats in response, setting empty array`)
              setBookedSeats([])
              bookedSeatsRef.current = []
            }
          } catch (seatsErr) {
            console.error("Error parsing seat availability:", seatsErr)
            // Continue without seat data - will use empty array
          }
        } else if (!resolvedScheduleId) {
          console.log(`[SEATS PAGE] No scheduleId available, skipping seat fetch`)
        } else {
          console.error("[DEBUG] Failed to fetch seat availability:", seatsResponse.status === 'rejected' ? seatsResponse.reason : 'Unknown error')
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err instanceof Error ? err.message : "Failed to load route")
      } finally {
        setLoading(false)
        fetchingRef.current = false
      }
    }

    fetchData()
  }, [resolvedParams.id, scheduleId])

  // Show error only if we have an error and no cached route
  if (error && !route) {
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

  // If we have cached route, show it immediately even if still loading
  // This provides instant feedback while fresh data loads
  if (!route && loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading route details...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Don't render if route is not loaded yet
  if (!route) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading route details...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // TypeScript type guard - route is guaranteed to be non-null here
  const currentRoute: Route = route

  // ALWAYS use the actual route data from database, NOT the user's search query
  // This ensures proper city names like "New York City, New York, USA" instead of partial search "new yor"
  const displayFrom = `${currentRoute.fromCity}${currentRoute.fromState ? `, ${currentRoute.fromState}` : ''}${currentRoute.fromCountry ? `, ${currentRoute.fromCountry}` : ''}`
  const displayTo = `${currentRoute.toCity}${currentRoute.toState ? `, ${currentRoute.toState}` : ''}${currentRoute.toCountry ? `, ${currentRoute.toCountry}` : ''}`
  
  const tripData = {
    id: currentRoute.id.toString(),
    operator: currentRoute.operator,
    from: displayFrom,
    to: displayTo,
    departureTime: currentRoute.departureTime,
    arrivalTime: currentRoute.arrivalTime,
    date: date || new Date().toLocaleDateString(),
    duration: currentRoute.duration,
    pricePerSeat: currentRoute.basePrice,
    type: currentRoute.vehicleType,
    mode: currentRoute.transportType || modeParam || mode, // Use route's transport type, then URL param, then state
    scheduleId: scheduleId || "",
  }

  const renderSeatSelector = () => {
    const commonProps = {
      selectedSeats,
      onSeatSelect: setSelectedSeats,
      bookedSeats: bookedSeats || [], // Ensure it's always an array
      seatsSelectedByOthers: Array.from(seatsSelectedByOthers),
      totalSeats: currentRoute.totalSeats,
      pricePerSeat: currentRoute.basePrice,
      maxSeats: totalPassengers, // Limit seat selection to number of passengers
    }
    
    switch (mode) {
      case "train":
        return <SeatSelectorTrain {...commonProps} />
      case "flight":
        return <SeatSelectorFlight {...commonProps} />
      default:
        return <SeatSelectorBus {...commonProps} />
    }
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
                // Build search URL with current params
                const params = new URLSearchParams()
                if (from) params.set("from", from)
                if (to) params.set("to", to)
                if (date) params.set("date", date)
                if (mode) params.set("mode", mode)
                // Prefetch before navigation for instant transition (only if router is ready)
                if (typeof window !== 'undefined' && router) {
                  try {
                    router.prefetch(`/search?${params.toString()}`)
                  } catch (err) {
                    // Silently handle prefetch errors
                  }
                  router.push(`/search?${params.toString()}`)
                }
              }}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </Button>
          </div>
          <TripDetails trip={tripData} />

          {/* Warning when scheduleId was auto-resolved (could be wrong date) */}
          {!scheduleId && resolvedScheduleId && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-amber-800 dark:text-amber-200 text-sm">
                <strong>⚠️ Note:</strong> No specific date was selected. Showing seats for the first available schedule.
                For accurate seat availability, please search again with a specific travel date.
              </p>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3 mt-8">
            <div className="lg:col-span-2">{renderSeatSelector()}</div>

            <div className="lg:col-span-1">
              <BookingSummary trip={tripData} selectedSeats={selectedSeats} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

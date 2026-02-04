"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SearchResults } from "@/components/search-results"
import { SearchFilters } from "@/components/search-filters"
import { PriceCalendar } from "@/components/price-calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Calendar, Search, SlidersHorizontal, Bus, Train, Plane, CalendarDays, ArrowLeft } from "lucide-react"
import { useState, useRef, useCallback, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AuthModal } from "@/components/auth-modal"
import { usePublicUpdates } from "@/hooks/use-socketio"

// Component to show all available routes when no search criteria or when search has no results
function AllAvailableRoutesSection({ mode, from, to, date, refreshKey, adults = 1, children = 0, infants = 0 }: { 
  mode: string; 
  from: string; 
  to: string; 
  date: string;
  refreshKey: number;
  adults?: number;
  children?: number;
  infants?: number;
}) {
  // Always show available routes section by default
  // No need to check search results - always display

  return (
    <section className="py-8 border-t border-border">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            {mode === "bus" && <Bus className="h-6 w-6" />}
            {mode === "train" && <Train className="h-6 w-6" />}
            {mode === "flight" && <Plane className="h-6 w-6" />}
            All Available {mode.charAt(0).toUpperCase() + mode.slice(1)} Routes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {from && to 
              ? `All available ${mode} routes:`
              : `Browse all available routes for ${mode} travel`
            }
          </p>
        </div>
        <div className="max-h-[600px] overflow-y-auto border border-border/50 rounded-xl p-6 bg-card shadow-sm hover:shadow-md transition-shadow duration-200 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-border/80">
          <SearchResults key={`all-routes-${refreshKey}`} mode={mode} from="" to="" date="" adults={adults} children={children} infants={infants} />
        </div>
      </div>
    </section>
  )
}

export default function SearchPage() {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL IN CONSISTENT ORDER
  // Step 1: Next.js navigation hooks and context hooks (must be called first)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  
  // Step 2: All useState hooks (must be grouped together)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  // const [showFilters, setShowFilters] = useState(false)
  // const [showPriceCalendar, setShowPriceCalendar] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [from, setFrom] = useState(searchParams.get("from") || "")
  const [to, setTo] = useState(searchParams.get("to") || "")
  const [date, setDate] = useState( searchParams.get("date") || "")
  const [returnDate, setReturnDate] = useState(searchParams.get("returnDate") || "")
  const [tripType, setTripType] = useState<"one-way" | "round-trip">((searchParams.get("tripType") as "one-way" | "round-trip") || "one-way")
  // Passenger selection state
  const adultsParam = searchParams.get("adults")
  const childrenParam = searchParams.get("children")
  const infantsParam = searchParams.get("infants")
  const passengersParam = searchParams.get("passengers")
  const [adults, setAdults] = useState(adultsParam ? parseInt(adultsParam, 10) : (passengersParam ? parseInt(passengersParam, 10) : 1))
  const [children, setChildren] = useState(childrenParam ? parseInt(childrenParam, 10) : 0)
  const [infants, setInfants] = useState(infantsParam ? parseInt(infantsParam, 10) : 0)
  const [showPassengerMenu, setShowPassengerMenu] = useState(false)
  
  // Validate mode/transportType
  const validModes = ['bus', 'train', 'flight'] as const
  const modeParam = searchParams.get("mode") || "bus"
  const validMode = validModes.includes(modeParam as typeof validModes[number]) ? modeParam : "bus"
  const [mode, setMode] = useState(validMode)
  const [showFromSuggestions, setShowFromSuggestions] = useState(false)
  const [showToSuggestions, setShowToSuggestions] = useState(false)
  const [fromSuggestions, setFromSuggestions] = useState<Array<{ iataCode: string; name: string; detailedName: string }>>([])
  const [toSuggestions, setToSuggestions] = useState<Array<{ iataCode: string; name: string; detailedName: string }>>([])
  const [loadingFrom, setLoadingFrom] = useState(false)
  const [loadingTo, setLoadingTo] = useState(false)

  // Step 3: All useRef hooks (must be grouped together after useState)
  const fromTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const toTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const searchDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastProcessedParamsRef = useRef<string>("") // Track last processed URL params to avoid unnecessary updates

  // Real-time updates from admin
  usePublicUpdates(
    () => setRefreshKey(prev => prev + 1), // Refresh when routes updated
    () => setRefreshKey(prev => prev + 1)  // Refresh when schedules updated
  )

  // Fetch location suggestions from API (optimized with caching)
  const fetchLocations = async (query: string, setSuggestions: (locations: any[]) => void, setLoading: (loading: boolean) => void) => {
    if (!query || query.length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }

    // Check client-side cache first (sessionStorage) - show immediately if available
    const cacheKey = `location-search-${query.toLowerCase().trim()}`
    let hasCachedData = false
    try {
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
        if (Date.now() - timestamp < CACHE_DURATION) {
          // Show cached data immediately - no loading state
          setSuggestions(data)
          setLoading(false)
          hasCachedData = true
          // Continue to fetch fresh data in background (stale-while-revalidate pattern)
        }
      }
    } catch (e) {
      // Cache read failed, continue with API call
    }

    // Only show loading if we don't have cached data
    if (!hasCachedData) {
      setLoading(true)
    }

    try {
      const response = await fetch(`/api/locations?q=${encodeURIComponent(query)}`, {
        cache: 'no-store', // Always fetch fresh - we handle caching client-side with sessionStorage
      })
      const data = await response.json()
      const locations = data.locations || []
      
      // Update suggestions with fresh data (even if we showed cached data)
      setSuggestions(locations)
      
      // Cache results in sessionStorage
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: locations,
          timestamp: Date.now()
        }))
      } catch (e) {
        // Storage quota exceeded, ignore
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
      // Only clear suggestions if we don't have cached data
      if (!hasCachedData) {
        setSuggestions([])
      }
    } finally {
      setLoading(false)
    }
  }

  // Debounced location search for "From"
  const debouncedFromSearch = useCallback((query: string) => {
    if (fromTimeoutRef.current) {
      clearTimeout(fromTimeoutRef.current)
    }
    fromTimeoutRef.current = setTimeout(() => {
      fetchLocations(query, setFromSuggestions, setLoadingFrom)
    }, 100) // Reduced to 100ms - cache makes this instant for repeated queries
  }, [])

  // Debounced location search for "To"
  const debouncedToSearch = useCallback((query: string) => {
    if (toTimeoutRef.current) {
      clearTimeout(toTimeoutRef.current)
    }
    toTimeoutRef.current = setTimeout(() => {
      fetchLocations(query, setToSuggestions, setLoadingTo)
    }, 100) // Reduced to 100ms - cache makes this instant for repeated queries
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (fromTimeoutRef.current) {
        clearTimeout(fromTimeoutRef.current)
      }
      if (toTimeoutRef.current) {
        clearTimeout(toTimeoutRef.current)
      }
    }
  }, [])

  // Update form fields when URL parameters change (e.g., navigating from hero section)
  useEffect(() => {
    // Create a string representation of current URL params to compare
    const currentParams = searchParams.toString()
    
    // Skip if we've already processed these params
    if (currentParams === lastProcessedParamsRef.current) {
      return
    }
    
    // Mark these params as processed
    lastProcessedParamsRef.current = currentParams
    
    const urlFrom = searchParams.get("from") || ""
    const urlTo = searchParams.get("to") || ""
    const urlDate = searchParams.get("date") || ""
    const urlReturnDate = searchParams.get("returnDate") || ""
    const urlTripType = (searchParams.get("tripType") as "one-way" | "round-trip") || "one-way"
    const urlAdults = searchParams.get("adults")
    const urlChildren = searchParams.get("children")
    const urlInfants = searchParams.get("infants")
    const urlMode = searchParams.get("mode") || "bus"
    const validModes = ['bus', 'train', 'flight'] as const
    const validUrlMode = validModes.includes(urlMode as typeof validModes[number]) ? urlMode : "bus"

    // Update state values from URL params
    if (urlFrom) setFrom(urlFrom)
    if (urlTo) setTo(urlTo)
    if (urlDate) setDate(urlDate)
    if (urlReturnDate) setReturnDate(urlReturnDate)
    if (urlTripType) setTripType(urlTripType)
    if (validUrlMode) setMode(validUrlMode)
    
    // Update passenger counts
    if (urlAdults) {
      const adultsNum = parseInt(urlAdults, 10)
      if (!isNaN(adultsNum)) setAdults(adultsNum)
    }
    if (urlChildren) {
      const childrenNum = parseInt(urlChildren, 10)
      if (!isNaN(childrenNum)) setChildren(childrenNum)
    }
    if (urlInfants) {
      const infantsNum = parseInt(urlInfants, 10)
      if (!isNaN(infantsNum)) setInfants(infantsNum)
    }
  }, [searchParams]) // Update when URL params change

  // Protect the search page - redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setAuthModalOpen(true)
      // Optionally redirect after showing modal
      // router.push("/")
    }
  }, [isAuthenticated, loading, router])

  // Debounced URL update when from/to changes - triggers route search
  useEffect(() => {
    // Clear previous timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    // Only update URL if user has typed something (not just initial load)
    if (from || to) {
      searchDebounceRef.current = setTimeout(() => {
        const params = new URLSearchParams()
        if (from) params.set("from", from)
        if (to) params.set("to", to)
        if (date) params.set("date", date)
        if (returnDate) params.set("returnDate", returnDate)
        const totalPassengers = adults + children + (mode === "flight" ? infants : 0)
        params.set("adults", adults.toString())
        params.set("children", children.toString())
        if (mode === "flight") {
          params.set("infants", infants.toString())
        }
        params.set("mode", mode)
        params.set("tripType", tripType)
        
        // Update URL without navigation to trigger SearchResults re-fetch
        // Prefetch before navigation (only if router is ready)
        if (typeof window !== 'undefined' && router) {
          try {
            router.prefetch(`/search?${params.toString()}`)
          } catch (err) {
            // Silently handle prefetch errors
          }
          router.replace(`/search?${params.toString()}`, { scroll: false })
        }
        setRefreshKey(prev => prev + 1) // Trigger refresh
      }, 500) // 500ms debounce for route search
    }

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [from, to, date, returnDate, adults, children, infants, mode, tripType, router])

  const handleSearch = () => {
    // Check authentication before search
    if (!isAuthenticated) {
      setAuthModalOpen(true)
      return
    }
    const totalPassengers = adults + children + (mode === "flight" ? infants : 0)
    const params = new URLSearchParams({
      from,
      to,
      date,
      adults: adults.toString(),
      children: children.toString(),
      ...(mode === "flight" ? { infants: infants.toString() } : {}),
      mode,
      tripType,
    })
    if (tripType === "round-trip" && returnDate) {
      params.set("returnDate", returnDate)
    }
    // Prefetch before navigation (only if router is ready)
    if (typeof window !== 'undefined' && router) {
      try {
        router.prefetch(`/search?${params.toString()}`)
      } catch (err) {
        // Silently handle prefetch errors
      }
      router.push(`/search?${params.toString()}`)
    }
  }

  const handleDateSelect = (newDate: string) => {
    setDate(newDate)
    const params = new URLSearchParams({
      from,
      to,
      date: newDate,
      adults: adults.toString(),
      children: children.toString(),
      ...(mode === "flight" ? { infants: infants.toString() } : {}),
      mode,
    })
    // Prefetch before navigation (only if router is ready)
    if (typeof window !== 'undefined' && router) {
      try {
        router.prefetch(`/search?${params.toString()}`)
      } catch (err) {
        // Silently handle prefetch errors
      }
      router.push(`/search?${params.toString()}`)
    }
  }

  // Handle transport type switch
  const handleModeChange = (newMode: string) => {
    // Clear search inputs
    setFrom("")
    setTo("")
    setDate("")
    setShowFromSuggestions(false)
    setShowToSuggestions(false)
    
    // Update mode
    setMode(newMode)
    
    // Update URL with new mode and clear search params
    const params = new URLSearchParams({
      mode: newMode,
      adults: adults.toString(),
      children: children.toString(),
      ...(newMode === "flight" ? { infants: infants.toString() } : {}),
    })
    // Prefetch before navigation (only if router is ready)
    if (typeof window !== 'undefined' && router) {
      try {
        router.prefetch(`/search?${params.toString()}`)
      } catch (err) {
        // Silently handle prefetch errors
      }
      router.push(`/search?${params.toString()}`)
    }
    
    // Trigger refresh to fetch routes for new transport type
    setRefreshKey(prev => prev + 1)
  }

  const getModeIcon = () => {
    switch (mode) {
      case "bus":
        return <Bus className="h-4 w-4" />
      case "train":
        return <Train className="h-4 w-4" />
      case "flight":
        return <Plane className="h-4 w-4" />
      default:
        return <Bus className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Search Bar */}
        <section className="border-b border-border bg-gradient-to-b from-muted/50 to-background">
          <div className="container mx-auto max-w-7xl px-4 py-6">
            {/* Back Button */}
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </div>
            {/* Transport Type Selector */}
            <div className="mb-4 flex items-center gap-2">
              <Button
                type="button"
                variant={mode === "bus" ? "default" : "outline"}
                size="sm"
                onClick={() => handleModeChange("bus")}
                className="gap-2"
              >
                <Bus className="h-4 w-4" />
                <span>Bus</span>
              </Button>
              <Button
                type="button"
                variant={mode === "train" ? "default" : "outline"}
                size="sm"
                onClick={() => handleModeChange("train")}
                className="gap-2"
              >
                <Train className="h-4 w-4" />
                <span>Train</span>
              </Button>
              <Button
                type="button"
                variant={mode === "flight" ? "default" : "outline"}
                size="sm"
                onClick={() => handleModeChange("flight")}
                className="gap-2"
              >
                <Plane className="h-4 w-4" />
                <span>Flight</span>
              </Button>
            </div>

            {/* Trip Type Toggle (only for train and flight) */}
            {mode !== "bus" && (
              <div className="mb-4 flex gap-2">
                <Button
                  type="button"
                  variant={tripType === "one-way" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTripType("one-way")
                    setReturnDate("")
                  }}
                  className="flex-1"
                >
                  One Way
                </Button>
                <Button
                  type="button"
                  variant={tripType === "round-trip" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTripType("round-trip")}
                  className="flex-1"
                >
                  Round Trip
                </Button>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[180px]">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                  <Input
                    placeholder="From (City or Airport)"
                    value={from}
                    onChange={(e) => {
                      setFrom(e.target.value)
                      debouncedFromSearch(e.target.value)
                    }}
                    onFocus={() => {
                      setShowFromSuggestions(true)
                      if (from) debouncedFromSearch(from)
                    }}
                    onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)}
                    className="pl-10 h-10 relative z-0 w-full"
                  />
                  {showFromSuggestions && (from.length >= 2 || fromSuggestions.length > 0) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-scroll scrollbar-thin z-50">
                      {loadingFrom ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">Searching...</div>
                      ) : fromSuggestions.length > 0 ? (
                        fromSuggestions.map((location) => (
                          <button
                            key={location.iataCode}
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
                            onClick={() => {
                              setFrom(location.detailedName || location.name)
                              setShowFromSuggestions(false)
                            }}
                          >
                            <div className="font-medium">{location.name}</div>
                            {location.detailedName && location.detailedName !== location.name && (
                              <div className="text-xs text-muted-foreground">{location.detailedName}</div>
                            )}
                          </button>
                        ))
                      ) : from.length >= 2 ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">No locations found</div>
                      ) : null}
                    </div>
                  )}
                </div>
                <div className="relative flex-1 min-w-[180px]">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                  <Input
                    placeholder="To (City or Airport)"
                    value={to}
                    onChange={(e) => {
                      setTo(e.target.value)
                      debouncedToSearch(e.target.value)
                    }}
                    onFocus={() => {
                      setShowToSuggestions(true)
                      if (to) debouncedToSearch(to)
                    }}
                    onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
                    className="pl-10 h-10 relative z-0 w-full"
                  />
                  {showToSuggestions && (to.length >= 2 || toSuggestions.length > 0) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-scroll scrollbar-thin z-50">
                      {loadingTo ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">Searching...</div>
                      ) : toSuggestions.length > 0 ? (
                        toSuggestions.map((location) => (
                          <button
                            key={location.iataCode}
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
                            onClick={() => {
                              setTo(location.detailedName || location.name)
                              setShowToSuggestions(false)
                            }}
                          >
                            <div className="font-medium">{location.name}</div>
                            {location.detailedName && location.detailedName !== location.name && (
                              <div className="text-xs text-muted-foreground">{location.detailedName}</div>
                            )}
                          </button>
                        ))
                      ) : to.length >= 2 ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">No locations found</div>
                      ) : null}
                    </div>
                  )}
                </div>
                <div className="relative flex-1 min-w-[150px]">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <Input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    min={new Date().toISOString().split("T")[0]}
                    className="pl-10 h-10 relative z-0 w-full" 
                  />
                </div>
                {tripType === "round-trip" && mode !== "bus" && (
                  <div className="relative flex-1 min-w-[150px]">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input 
                      type="date" 
                      value={returnDate} 
                      onChange={(e) => {
                        const newReturnDate = e.target.value
                        // Validate return date is after departure date
                        if (newReturnDate && date) {
                          const returnDateObj = new Date(newReturnDate)
                          const departureDateObj = new Date(date)
                          if (returnDateObj <= departureDateObj) {
                            // Don't set invalid date, show error via toast if needed
                            return
                          }
                        }
                        setReturnDate(newReturnDate)
                      }} 
                      min={date || new Date().toISOString().split("T")[0]}
                      placeholder="Return Date"
                      className="pl-10 h-10 relative z-0 w-full" 
                    />
                  </div>
                )}
                <div className="relative flex-1 min-w-[180px]">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 bg-background justify-start font-normal"
                    onClick={() => setShowPassengerMenu(!showPassengerMenu)}
                  >
                    <span className="flex-1 text-left">
                      {adults + children + (mode === "flight" ? infants : 0)} {adults + children + (mode === "flight" ? infants : 0) === 1 ? "Passenger" : "Passengers"}
                      {adults > 0 && ` (${adults} Adult${adults > 1 ? "s" : ""})`}
                      {children > 0 && ` (${children} Child${children > 1 ? "ren" : ""})`}
                      {mode === "flight" && infants > 0 && ` (${infants} Infant${infants > 1 ? "s" : ""})`}
                    </span>
                  </Button>

                  {showPassengerMenu && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl p-4 space-y-4 z-50 max-h-[400px] overflow-y-auto">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Adults</p>
                          <p className="text-xs text-muted-foreground">12+ years</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setAdults(Math.max(1, adults - 1))}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{adults}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setAdults(Math.min(9, adults + 1))}
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Children</p>
                          <p className="text-xs text-muted-foreground">2-11 years</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setChildren(Math.max(0, children - 1))}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{children}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setChildren(Math.min(9, children + 1))}
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Infants</p>
                          <p className="text-xs text-muted-foreground">Under 2 years</p>
                          {mode !== "flight" && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Only for flights</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setInfants(Math.max(0, infants - 1))}
                            disabled={mode !== "flight"}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{infants}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setInfants(Math.min(9, infants + 1))}
                            disabled={mode !== "flight"}
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      <Button type="button" className="w-full" onClick={() => setShowPassengerMenu(false)}>
                        Done
                      </Button>
                    </div>
                  )}
                </div>
                <Button className="bg-accent hover:bg-accent/90 flex-shrink-0 h-10" onClick={handleSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
              <div className="flex gap-2">
                {/* Flexible Dates button commented out */}
                {/* <Button
                  variant={showPriceCalendar ? "default" : "outline"}
                  onClick={() => setShowPriceCalendar(!showPriceCalendar)}
                  className="md:w-auto"
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Flexible Dates
                </Button> */}
                {/* Filter button commented out */}
                {/* <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="md:w-auto">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                </Button> */}
              </div>
            </div>
          </div>
        </section>

        {/* Flexible Dates calendar commented out */}
        {/* {showPriceCalendar && (
          <section className="border-b border-border bg-muted/30">
            <div className="container mx-auto max-w-7xl px-4 py-6">
              <PriceCalendar selectedDate={date} onDateSelect={handleDateSelect} mode={mode} />
            </div>
          </section>
        )} */}

        {/* Results Section - Show when there's at least a from city */}
        {from && (
          <section className="py-8">
            <div className="container mx-auto max-w-7xl px-4">
              <div className="grid gap-6 lg:grid-cols-4">
                {/* Filters commented out */}
                {/* {showFilters && (
                  <div className="lg:col-span-1">
                    <SearchFilters onFiltersChange={() => setRefreshKey(prev => prev + 1)} availableOperators={[]} />
                  </div>
                )} */}
                <div className="lg:col-span-4">
                  <SearchResults 
                    key={refreshKey} 
                    mode={mode} 
                    from={from} 
                    to={to} 
                    date={date} 
                    tripType={tripType}
                    returnDate={tripType === "round-trip" ? returnDate : ""}
                    adults={adults}
                    children={children}
                    infants={infants}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* All Available Routes Section - Show only when not searching */}
        {!from && (
          <AllAvailableRoutesSection 
            mode={mode} 
            from={from} 
            to={to} 
            date={date}
            refreshKey={refreshKey}
            adults={adults}
            children={children}
            infants={infants}
          />
        )}
      </main>

      <Footer />

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} defaultTab="signup" />
    </div>
  )
}

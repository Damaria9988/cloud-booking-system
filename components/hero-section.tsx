"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Bus, Train, Plane, MapPin, Calendar, Search, ArrowRight, Sparkles, Loader2 } from "lucide-react"
import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AuthModal } from "@/components/auth-modal"
import { toast } from "sonner"
import { useSocketIO } from "@/hooks/use-socketio"
import type { SocketIOMessage } from "@/hooks/use-socketio"

interface UserProfile {
  id: number
  firstName: string
  lastName: string
  email: string
  initials: string
}

export function HeroSection() {
  const [selectedMode, setSelectedMode] = useState("bus")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])

  // Function to fetch user count and profiles
  const fetchUserStats = useCallback(async () => {
    try {
      const response = await fetch("/api/stats?includeUsers=true")
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }
      const data = await response.json()
      if (data.totalUsers !== undefined) {
        setTotalUsers(data.totalUsers)
      }
      if (data.users && Array.isArray(data.users)) {
        setUserProfiles(data.users)
      }
    } catch (error) {
      console.error("Failed to fetch user count:", error)
      // Only set fallback if we don't have any data yet (not if we're refreshing)
      // This prevents showing fallback when we already have real data
      setTotalUsers((prev) => prev === null ? 50000 : prev)
    }
  }, [])

  // Fetch immediately on mount - this is important visible content, not blocking
  useEffect(() => {
    fetchUserStats()
  }, [fetchUserStats])

  // Handle real-time user count updates via Socket.IO
  const handleStatsUpdate = useCallback((message: SocketIOMessage) => {
    if (message.type === 'user_count_updated') {
      // Refresh user stats when user count is updated
      fetchUserStats()
    } else if (message.type === 'user_created') {
      // Refresh user stats when new user is created
      fetchUserStats()
    }
  }, [fetchUserStats])

  // Set up Socket.IO connection for real-time stats updates - defer to avoid blocking render
  const { subscribe, unsubscribe, isConnected, connect } = useSocketIO({
    autoConnect: false, // Don't auto-connect - we'll connect manually after render
    autoReconnect: true,
    onMessage: handleStatsUpdate,
    showToastNotifications: false,
  })

  // Defer Socket.IO connection and subscription to avoid blocking initial render
  useEffect(() => {
    // Delay Socket.IO connection until after initial render completes
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        requestIdleCallback(() => {
          connect()
        }, { timeout: 2000 })
      } else {
        // Fallback: delay by 1 second
        setTimeout(() => {
          connect()
        }, 1000)
      }
    }, 200) // Small initial delay
    
    return () => {
      clearTimeout(timer)
      unsubscribe('public:stats')
    }
  }, [connect, unsubscribe])

  // Subscribe once connected
  useEffect(() => {
    if (isConnected) {
      subscribe('public:stats')
      return () => unsubscribe('public:stats')
    }
  }, [isConnected, subscribe, unsubscribe])
  const [date, setDate] = useState("")
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const [tripType, setTripType] = useState<"one-way" | "round-trip">("one-way")
  const [returnDate, setReturnDate] = useState("")
  const [showPassengerMenu, setShowPassengerMenu] = useState(false)

  // Reset trip type to one-way when switching to bus mode
  const handleModeChange = (mode: string) => {
    setSelectedMode(mode)
    if (mode === "bus") {
      setTripType("one-way")
      setReturnDate("")
    }
    // Removed auto-navigation - let users enter details first before searching
  }
  const [showFromSuggestions, setShowFromSuggestions] = useState(false)
  const [showToSuggestions, setShowToSuggestions] = useState(false)
  const [fromSuggestions, setFromSuggestions] = useState<Array<{ iataCode: string; name: string; detailedName: string }>>([])
  const [toSuggestions, setToSuggestions] = useState<Array<{ iataCode: string; name: string; detailedName: string }>>([])
  const [loadingFrom, setLoadingFrom] = useState(false)
  const [loadingTo, setLoadingTo] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("signup")
  const [pendingBrowseRoutes, setPendingBrowseRoutes] = useState(false)
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const fromTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const toTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Fetch location suggestions from API (optimized with caching and memoization)
  const fetchLocations = useCallback(async (query: string, setSuggestions: (locations: any[]) => void, setLoading: (loading: boolean) => void) => {
    if (!query || query.length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }

    // Check client-side cache first (sessionStorage) - show immediately if available
    const cacheKey = `location-search-${query.toLowerCase().trim()}`
    let hasCachedData = false
    let cachedData: any[] | null = null
    
    // Optimize: Use try-catch but don't block on cache read
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
          // Use a small timeout to avoid blocking render
          const parsed = JSON.parse(cached)
          const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
          if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            cachedData = parsed.data
            hasCachedData = true
          }
        }
      } catch (e) {
        // Cache read failed, continue with API call
      }
    }

    // Show cached data immediately if available
    if (hasCachedData && cachedData) {
      setSuggestions(cachedData)
      setLoading(false)
    } else {
      setLoading(true)
    }

    // Fetch fresh data (even if we have cached data - stale-while-revalidate)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout
      
      const response = await fetch(`/api/locations?q=${encodeURIComponent(query)}`, {
        cache: 'no-store', // Always fetch fresh data - we handle caching client-side
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      
      const data = await response.json()
      const locations = data.locations || []
      
      // Update suggestions with fresh data
      setSuggestions(locations)
      
      // Cache results in sessionStorage (non-blocking)
      if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
          // Use setTimeout to defer storage write and avoid blocking
          setTimeout(() => {
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify({
                data: locations,
                timestamp: Date.now()
              }))
            } catch (e) {
              // Storage quota exceeded, ignore
            }
          }, 0)
        } catch (e) {
          // Ignore storage errors
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching locations:', error)
      }
      // Only clear suggestions if we don't have cached data
      if (!hasCachedData) {
        setSuggestions([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced location search for "From"
  // Optimized debounced search with faster response
  const debouncedFromSearch = useCallback((query: string) => {
    if (fromTimeoutRef.current) {
      clearTimeout(fromTimeoutRef.current)
    }
    fromTimeoutRef.current = setTimeout(() => {
      fetchLocations(query, setFromSuggestions, setLoadingFrom)
    }, 100) // Reduced to 100ms for faster response - cache makes this instant for repeated queries
  }, [])

  // Debounced location search for "To"
  const debouncedToSearch = useCallback((query: string) => {
    if (toTimeoutRef.current) {
      clearTimeout(toTimeoutRef.current)
    }
    toTimeoutRef.current = setTimeout(() => {
      fetchLocations(query, setToSuggestions, setLoadingTo)
    }, 100) // Reduced to 100ms for faster response - cache makes this instant for repeated queries
  }, [])

  const handleSearch = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    setSearchLoading(true)
    
    // First, validate that all required fields are filled
    if (!from || !to || !date) {
      toast.error("Please fill in all required fields", {
        description: "From, To, and Date are required to search for tickets.",
      })
      setSearchLoading(false)
      return
    }

    // Then check if user is authenticated - show signup modal if not
    if (!isAuthenticated) {
      setAuthModalTab("signup")
      setAuthModalOpen(true)
      setSearchLoading(false)
      return
    }

    // For bus, ensure trip type is one-way
    const finalTripType = selectedMode === "bus" ? "one-way" : tripType

    const totalPassengers = adults + children + (selectedMode === "flight" ? infants : 0)
    const params = new URLSearchParams({
      from,
      to,
      date,
      adults: adults.toString(),
      children: children.toString(),
      ...(selectedMode === "flight" ? { infants: infants.toString() } : {}),
      mode: selectedMode,
      tripType: finalTripType,
      ...(finalTripType === "round-trip" && returnDate ? { returnDate } : {}),
    })

    // Prefetch before navigation for instant transition (only if router is ready)
    if (typeof window !== 'undefined' && router) {
      try {
        router.prefetch(`/search?${params.toString()}`)
      } catch (err) {
        // Silently handle prefetch errors
      }
      router.push(`/search?${params.toString()}`)
    }
    // Note: Loading state will reset when component unmounts or user navigates away
  }

  const handleBrowseRoutes = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Set flag to navigate after authentication
      setPendingBrowseRoutes(true)
      setAuthModalTab("signup")
      setAuthModalOpen(true)
      return
    }

    // User is authenticated, navigate to search page (only if router is ready)
    if (typeof window !== 'undefined' && router) {
      try {
        router.prefetch("/search")
      } catch (err) {
        // Silently handle prefetch errors
      }
      router.push("/search")
    }
  }

  // Navigate to search page after successful authentication if browse routes was pending
  useEffect(() => {
    if (isAuthenticated && pendingBrowseRoutes) {
      setPendingBrowseRoutes(false)
      if (typeof window !== 'undefined' && router) {
        try {
          router.prefetch("/search")
        } catch (err) {
          // Silently handle prefetch errors
        }
        router.push("/search")
      }
    }
  }, [isAuthenticated, pendingBrowseRoutes, router])

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/90 dark:from-primary dark:via-primary/90 dark:to-background">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl animate-pulse-glow" />
        <div
          className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-pulse-glow"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary-foreground/5 blur-3xl" />
      </div>

      <div className="container relative mx-auto max-w-7xl px-4 py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Hero Content */}
          <div className="space-y-8 relative z-0 lg:pointer-events-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur-sm border border-accent/30">
              <Sparkles className="h-4 w-4" />
              <span>{"Save up to 40% on your first booking"}</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl md:text-6xl lg:text-7xl text-balance">
              {"Travel Smarter, Not Harder"}
            </h1>

            <p className="text-lg text-primary-foreground/90 sm:text-xl max-w-2xl text-pretty leading-relaxed">
              {
                "Book bus, train, and flight tickets in seconds. Real-time availability, transparent pricing, and exclusive student discounts—all in one modern platform."
              }
            </p>

            <div className="flex flex-col sm:flex-row gap-4 relative z-0">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl shadow-accent/20 group relative z-0"
                onClick={() => document.getElementById("search-card")?.scrollIntoView({ behavior: "smooth" })}
              >
                {"Start Booking Now"}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 backdrop-blur-sm relative z-0"
              >
                {"Learn More"}
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {userProfiles.length > 0 ? (
                    userProfiles.slice(0, 4).map((user) => {
                      // Generate consistent color based on user ID
                      const colors = [
                        "bg-gradient-to-br from-blue-500 to-blue-600",
                        "bg-gradient-to-br from-purple-500 to-purple-600",
                        "bg-gradient-to-br from-pink-500 to-pink-600",
                        "bg-gradient-to-br from-green-500 to-green-600",
                        "bg-gradient-to-br from-orange-500 to-orange-600",
                        "bg-gradient-to-br from-red-500 to-red-600",
                      ]
                      const colorIndex = user.id % colors.length
                      return (
                        <div
                          key={user.id}
                          className={`h-8 w-8 rounded-full ${colors[colorIndex]} border-2 border-primary flex items-center justify-center text-white text-xs font-semibold shadow-md`}
                          title={`${user.firstName} ${user.lastName}`}
                        >
                          {user.initials}
                        </div>
                      )
                    })
                  ) : (
                    // Fallback to mock circles while loading
                    [1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full bg-accent/80 border-2 border-primary" />
                    ))
                  )}
                </div>
                <span className="text-sm text-primary-foreground/80">
                  {totalUsers !== null 
                    ? `${totalUsers.toLocaleString()}+ happy travelers` 
                    : "Loading travelers..."}
                </span>
              </div>
              <div className="flex items-center gap-1 text-primary-foreground/90">
                {"⭐".repeat(5)}
                <span className="ml-2 text-sm font-medium">{"4.9/5 Rating"}</span>
              </div>
            </div>

            <div className="relative mt-8 lg:hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 rounded-3xl blur-2xl" />
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-primary-foreground/10 shadow-2xl">
                <Image
                  src="/modern-travel-booking-app-interface-on-laptop-and-.jpg"
                  alt="Modern travel booking interface"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Search Card */}
          <div className="relative z-30 pointer-events-auto" id="search-card">
            {/* Floating decoration */}
            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-accent/30 blur-2xl animate-float pointer-events-none" />
            <div
              className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-accent/20 blur-2xl animate-float pointer-events-none"
              style={{ animationDelay: "3s" }}
            />

            <Card className="relative backdrop-blur-xl bg-card/95 shadow-2xl border-border/50 overflow-visible pointer-events-auto">
              <div className="p-6 sm:p-8 relative z-10 pointer-events-auto overflow-visible">
                <Tabs value={selectedMode} onValueChange={handleModeChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="bus" className="gap-2">
                      <Bus className="h-4 w-4" />
                      <span className="hidden sm:inline">Bus</span>
                    </TabsTrigger>
                    <TabsTrigger value="train" className="gap-2">
                      <Train className="h-4 w-4" />
                      <span className="hidden sm:inline">Train</span>
                    </TabsTrigger>
                    <TabsTrigger value="flight" className="gap-2">
                      <Plane className="h-4 w-4" />
                      <span className="hidden sm:inline">Flight</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={selectedMode} className="space-y-4 mt-0 relative z-10">
                    {/* Only show round trip option for train and flight, not for bus */}
                    {selectedMode !== "bus" && (
                      <div className="flex gap-2 mb-4">
                        <Button
                          type="button"
                          variant={tripType === "one-way" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTripType("one-way")}
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

                    <form 
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleSearch(e)
                      }} 
                      className="space-y-4 relative z-20 overflow-visible"
                      noValidate
                    >
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
                        <Input
                          placeholder={
                            selectedMode === "flight"
                              ? "From (City or Airport)"
                              : selectedMode === "train"
                              ? "From (City or Station)"
                              : "From (City)"
                          }
                          className="pl-10 h-12 bg-background relative z-20"
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
                          disabled={false}
                          readOnly={false}
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

                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
                        <Input
                          placeholder={
                            selectedMode === "flight"
                              ? "To (City or Airport)"
                              : selectedMode === "train"
                              ? "To (City or Station)"
                              : "To (City)"
                          }
                          className="pl-10 h-12 bg-background relative z-20"
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
                          disabled={false}
                          readOnly={false}
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

                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
                          <Input
                            type="date"
                            placeholder="Departure"
                            className="pl-10 h-12 bg-background relative z-20"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            disabled={false}
                            readOnly={false}
                          />
                        </div>
                        {tripType === "round-trip" && selectedMode !== "bus" && (
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
                            <Input
                              type="date"
                              placeholder="Return"
                              className="pl-10 h-12 bg-background relative z-20"
                              value={returnDate}
                              onChange={(e) => setReturnDate(e.target.value)}
                              min={date || new Date().toISOString().split("T")[0]}
                              disabled={false}
                              readOnly={false}
                            />
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-12 bg-background justify-start font-normal"
                          onClick={() => setShowPassengerMenu(!showPassengerMenu)}
                        >
                          <span className="flex-1 text-left">
                            {adults + children + (selectedMode === "flight" ? infants : 0)} {adults + children + (selectedMode === "flight" ? infants : 0) === 1 ? "Passenger" : "Passengers"}
                            {adults > 0 && ` (${adults} Adult${adults > 1 ? "s" : ""})`}
                            {children > 0 && ` (${children} Child${children > 1 ? "ren" : ""})`}
                            {selectedMode === "flight" && infants > 0 && ` (${infants} Infant${infants > 1 ? "s" : ""})`}
                          </span>
                        </Button>

                        {showPassengerMenu && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl p-4 space-y-4 z-[100] max-h-[400px] overflow-y-auto">
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
                                {selectedMode !== "flight" && (
                                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Only for flights</p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setInfants(Math.max(0, infants - 1))}
                                  disabled={selectedMode !== "flight"}
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center">{infants}</span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setInfants(Math.min(9, infants + 1))}
                                  disabled={selectedMode !== "flight"}
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

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleSearch(e)
                          }}
                          className="flex-1 h-12 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg group"
                          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                          disabled={searchLoading}
                        >
                          {searchLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              {"Searching..."}
                            </>
                          ) : (
                            <>
                              <Search className="mr-2 h-5 w-5" />
                              {"Search Available Tickets"}
                              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          onClick={handleBrowseRoutes}
                          variant="secondary"
                          className="h-12 bg-muted/50 hover:bg-muted text-foreground shadow-sm hover:shadow transition-all duration-200 font-medium border-0"
                          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                        >
                          <Search className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">Browse All</span>
                          <span className="sm:hidden">Browse</span>
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* First-time user promotional banner commented out */}
                {/* <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    {"✨ First-time user? Use code"} <span className="font-bold text-accent">WELCOME40</span>
                    {" for 40% off"}
                  </p>
                </div> */}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom wave separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="currentColor"
            className="text-background"
          />
        </svg>
      </div>

      {!isAuthenticated && (
        <AuthModal 
          open={authModalOpen} 
          onOpenChange={(open) => {
            setAuthModalOpen(open)
            if (!open) {
              setSearchLoading(false) // Reset loading when modal closes
            }
          }} 
          defaultTab={authModalTab} 
        />
      )}
    </section>
  )
}

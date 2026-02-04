"use client"

import { Loader2, Bus, Train, Plane } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { RoutesList, useSearchRoutes } from "./search-results/index"
import { Separator } from "@/components/ui/separator"

interface SearchResultsProps {
  mode: string
  from: string
  to: string
  date: string
  tripType?: "one-way" | "round-trip"
  returnDate?: string
  refreshKey?: number
  adults?: number
  children?: number
  infants?: number
  showAllRoutes?: boolean // Option to show all available routes section
}

export function SearchResults({ 
  mode, 
  from, 
  to, 
  date, 
  tripType = "one-way", 
  returnDate = "", 
  refreshKey = 0, 
  adults: adultsProp, 
  children: childrenProp, 
  infants: infantsProp,
  showAllRoutes = true // Default to showing all routes
}: SearchResultsProps) {
  const searchParams = useSearchParams()
  
  // Get passenger counts from props (preferred) or URL params (fallback)
  const adults = adultsProp ?? parseInt(searchParams?.get("adults") || "1", 10)
  const children = childrenProp ?? parseInt(searchParams?.get("children") || "0", 10)
  const infants = infantsProp ?? parseInt(searchParams?.get("infants") || "0", 10)

  // Use custom hook for searched route fetching and real-time updates
  const {
    routes,
    returnRoutes,
    loading,
    loadingReturn,
    error,
    isInitialLoad,
    navigatingTo,
    setNavigatingTo,
  } = useSearchRoutes({
    mode,
    from,
    to,
    date,
    tripType,
    returnDate,
    refreshKey,
  })

  // Fetch ALL available routes for this mode (no from/to filter)
  const {
    routes: allRoutes,
    loading: loadingAllRoutes,
    isInitialLoad: isInitialLoadAllRoutes,
    navigatingTo: navigatingToAll,
    setNavigatingTo: setNavigatingToAll,
  } = useSearchRoutes({
    mode,
    from: "", // No filter - get all routes
    to: "",
    date: "",
    tripType: "one-way",
    returnDate: "",
    refreshKey,
  })

  const getModeIcon = () => {
    switch (mode) {
      case "bus": return <Bus className="h-5 w-5" />
      case "train": return <Train className="h-5 w-5" />
      case "flight": return <Plane className="h-5 w-5" />
      default: return <Bus className="h-5 w-5" />
    }
  }

  const getModeName = () => {
    switch (mode) {
      case "bus": return "Bus"
      case "train": return "Train"
      case "flight": return "Flight"
      default: return "Bus"
    }
  }

  // Full loading state on initial load
  if (loading && isInitialLoad && routes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading routes...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-2">{error}</p>
        <p className="text-sm text-muted-foreground">Please try again or adjust your search criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Outbound Journey */}
      <RoutesList
        routes={routes}
        loading={loading}
        isInitialLoad={isInitialLoad}
        mode={mode}
        from={from}
        to={to}
        date={date}
        returnDate={returnDate}
        tripType={tripType}
        adults={adults}
        children={children}
        infants={infants}
        navigatingTo={navigatingTo}
        onNavigate={setNavigatingTo}
        isReturn={false}
      />

      {/* Return Journey (only for round trip) */}
      {tripType === "round-trip" && (
        <RoutesList
          routes={returnRoutes}
          loading={loadingReturn}
          isInitialLoad={isInitialLoad}
          mode={mode}
          from={from}
          to={to}
          date={date}
          returnDate={returnDate}
          tripType={tripType}
          adults={adults}
          children={children}
          infants={infants}
          navigatingTo={navigatingTo}
          onNavigate={setNavigatingTo}
          isReturn={true}
        />
      )}

      {/* All Available Routes Section - Always show if there are routes */}
      {showAllRoutes && allRoutes.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {getModeIcon()}
              All Available {getModeName()} Routes
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {allRoutes.length} route{allRoutes.length !== 1 ? "s" : ""} available • Browse all {mode} routes in our network
            </p>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto border border-border/50 rounded-xl p-4 bg-card/50 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
            {loadingAllRoutes && allRoutes.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading available routes...</span>
              </div>
            ) : (
              <RoutesList
                routes={allRoutes}
                loading={loadingAllRoutes}
                isInitialLoad={isInitialLoadAllRoutes}
                mode={mode}
                from=""
                to=""
                date=""
                returnDate=""
                tripType="one-way"
                adults={adults}
                children={children}
                infants={infants}
                navigatingTo={navigatingToAll}
                onNavigate={setNavigatingToAll}
                isReturn={false}
                hideHeader={true}
                compact={true}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

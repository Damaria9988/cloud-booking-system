"use client"

import { Loader2, Bus, Train, Plane } from "lucide-react"
import { RouteCard } from "./route-card"
import { type Route } from "./use-search-routes"

interface RoutesListProps {
  routes: Route[]
  loading: boolean
  isInitialLoad: boolean
  mode: string
  from: string
  to: string
  date: string
  returnDate?: string
  tripType?: "one-way" | "round-trip"
  adults: number
  children: number
  infants: number
  navigatingTo: number | null
  onNavigate: (tripId: number) => void
  isReturn?: boolean
  hideHeader?: boolean // Hide header when used inside another section
  compact?: boolean // Compact mode for nested lists
}

export function RoutesList({
  routes,
  loading,
  isInitialLoad,
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
  isReturn = false,
  hideHeader = false,
  compact = false,
}: RoutesListProps) {
  const getModeIcon = () => {
    switch (mode) {
      case "bus":
        return <Bus className="h-5 w-5" />
      case "train":
        return <Train className="h-5 w-5" />
      case "flight":
        return <Plane className="h-5 w-5" />
      default:
        return <Bus className="h-5 w-5" />
    }
  }

  const displayFrom = isReturn ? to : from
  const displayTo = isReturn ? from : to
  const displayDate = isReturn ? returnDate : date

  const title = isReturn 
    ? "Return Journey" 
    : tripType === "round-trip" 
      ? "Outbound Journey" 
      : `Find Your ${mode === "bus" ? "Bus" : mode === "train" ? "Train" : "Flight"}`

  return (
    <div>
      {/* Header - can be hidden when used as nested list */}
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              {getModeIcon()}
              {title}
              {loading && !isInitialLoad && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />
              )}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {routes.length} result{routes.length !== 1 ? "s" : ""} found
              {displayFrom && displayTo && ` • ${displayFrom} to ${displayTo}`}
              {displayFrom && !displayTo && ` • From ${displayFrom}`}
              {displayDate && ` • ${new Date(displayDate).toLocaleDateString()}`}
              {!displayFrom && !displayTo && " • All available routes"}
              {loading && !isInitialLoad && " • Updating..."}
            </p>
          </div>
        </div>
      )}

      {routes.length === 0 && !loading ? (
        <div className={`text-center ${compact ? "py-6" : "py-12"}`}>
          <p className="text-muted-foreground mb-2">
            {displayFrom && displayTo 
              ? `No ${isReturn ? "return " : ""}routes found from ${displayFrom} to ${displayTo}`
              : displayFrom
              ? `No routes found from ${displayFrom}`
              : `No ${isReturn ? "return " : ""}routes available at the moment`
            }
          </p>
          <p className="text-sm text-muted-foreground">
            Please try adjusting your search criteria or check back later.
          </p>
        </div>
      ) : (
        <div className={compact 
          ? "space-y-3" 
          : "max-h-[800px] overflow-y-auto space-y-4 border border-border/50 rounded-xl p-6 bg-card shadow-sm hover:shadow-md transition-shadow duration-200 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-border/80"
        }>
          {loading && routes.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">
                Loading {isReturn ? "return " : ""}routes...
              </span>
            </div>
          )}
          {routes.map((trip) => (
            <RouteCard
              key={trip.id}
              trip={trip}
              isReturn={isReturn}
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
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Armchair, Wifi, Monitor, Utensils, Star, X } from "lucide-react"
import { toast } from "sonner"
import { 
  isBusinessClassSeat, 
  getSeatPrice, 
  BUSINESS_CLASS_PREMIUM 
} from "@/lib/pricing"

// Re-export for backward compatibility
export { isBusinessClassSeat, getSeatPrice }

interface SeatSelectorFlightProps {
  selectedSeats: string[]
  onSeatSelect: (seats: string[]) => void
  bookedSeats?: string[]
  seatsSelectedByOthers?: string[]
  totalSeats?: number
  pricePerSeat?: number
  maxSeats?: number
  onBusinessSeatsChange?: (businessSeats: string[]) => void
}

export function SeatSelectorFlight({ selectedSeats, onSeatSelect, bookedSeats = [], seatsSelectedByOthers = [], totalSeats = 120, pricePerSeat = 0, maxSeats, onBusinessSeatsChange }: SeatSelectorFlightProps) {
  const maxSelectableSeats = maxSeats || totalSeats
  // Calculate rows and seats per row based on totalSeats (assuming 3-3 layout: 6 seats per row)
  const seatsPerRow = 6
  const totalRows = Math.ceil(totalSeats / seatsPerRow)
  const seatLabels = ["A", "B", "C", "D", "E", "F"]
  
  // Calculate business class price
  const businessPrice = Math.round(pricePerSeat * (1 + BUSINESS_CLASS_PREMIUM))
  const economyPrice = pricePerSeat

  const handleSeatClick = (seatId: string) => {
    if (bookedSeats.includes(seatId)) return
    if (seatsSelectedByOthers.includes(seatId)) {
      toast.warning("This seat is being selected by another user")
      return
    }
    
    let newSelectedSeats: string[]
    if (selectedSeats.includes(seatId)) {
      newSelectedSeats = selectedSeats.filter((s) => s !== seatId)
    } else {
      // Limit selection to number of passengers (maxSeats)
      if (selectedSeats.length < maxSelectableSeats) {
        newSelectedSeats = [...selectedSeats, seatId]
      } else {
        toast.info(`You can only select ${maxSelectableSeats} seat${maxSelectableSeats > 1 ? 's' : ''} for ${maxSelectableSeats} passenger${maxSelectableSeats > 1 ? 's' : ''}`)
        return
      }
    }
    
    onSeatSelect(newSelectedSeats)
    
    // Notify parent about business class seats for pricing
    if (onBusinessSeatsChange) {
      const businessSeats = newSelectedSeats.filter(isBusinessClassSeat)
      onBusinessSeatsChange(businessSeats)
    }
  }

  const getSeatStatus = (seatId: string) => {
    if (bookedSeats.includes(seatId)) return "booked"
    if (selectedSeats.includes(seatId)) return "selected"
    if (seatsSelectedByOthers.includes(seatId)) return "selected-by-others"
    return "available"
  }

  const isBusiness = (row: number) => row < 4

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Armchair className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Select Your Flight Seats</CardTitle>
              <p className="text-sm text-muted-foreground">Boeing 737 - Business & Economy</p>
            </div>
          </div>
          <Badge variant="outline" className="text-base">
            {selectedSeats.length} / {maxSelectableSeats}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Cockpit */}
        <div className="mb-6 rounded-t-[3rem] rounded-b-xl p-4 bg-gradient-to-b from-primary/20 to-primary/5 border-2 border-primary/30">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 font-semibold">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">✈️</div>
              <span>Cockpit</span>
            </div>
          </div>
        </div>

        {/* Business Class Section */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-2 border-amber-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-sm">Business Class</span>
              {pricePerSeat > 0 && (
                <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700">
                  +35% Premium
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              {pricePerSeat > 0 && (
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">${businessPrice}/seat</span>
              )}
              <div className="flex gap-2 text-amber-600">
                <Wifi className="h-4 w-4" />
                <Monitor className="h-4 w-4" />
                <Utensils className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, rowIndex) => (
              <div key={rowIndex} className="flex items-center gap-3">
                <div className="w-8 text-center font-bold text-sm">{rowIndex + 1}</div>

                {/* Left side: 3 seats (ABC) */}
                <div className="flex gap-3">
                  {["A", "B", "C"].map((seat) => {
                    const seatId = `${rowIndex + 1}${seat}`
                    const status = getSeatStatus(seatId)

                    return (
                      <button
                        key={seat}
                        onClick={() => handleSeatClick(seatId)}
                        disabled={status === "booked" || status === "selected-by-others"}
                        className={cn(
                          "h-16 w-16 rounded-xl border-2 transition-all duration-200 relative group",
                          "flex flex-col items-center justify-center",
                          status === "available" &&
                            "bg-amber-50 border-amber-200 hover:border-amber-500 hover:bg-amber-100 hover:scale-105 cursor-pointer dark:bg-amber-950 dark:border-amber-800",
                          status === "selected" &&
                            "bg-accent border-accent text-accent-foreground scale-105 shadow-xl shadow-accent/30 ring-2 ring-accent/50",
                          status === "selected-by-others" &&
                            "bg-amber-50 border-amber-300 cursor-not-allowed opacity-75 dark:bg-amber-950/30 dark:border-amber-800/50 animate-pulse",
                          status === "booked" &&
                            "bg-red-50 border-red-300 cursor-not-allowed opacity-75 dark:bg-red-950/30 dark:border-red-800/50",
                        )}
                      >
                        {status === "booked" ? (
                          <X className="h-6 w-6 text-red-500 dark:text-red-400" />
                        ) : status === "selected-by-others" ? (
                          <Armchair className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <Armchair
                            className={cn("h-6 w-6 transition-transform", status === "selected" && "scale-110")}
                          />
                        )}
                        <span className={cn(
                          "text-[10px] font-bold mt-1",
                          status === "booked" && "text-red-600 dark:text-red-400",
                          status === "selected-by-others" && "text-amber-700 dark:text-amber-300"
                        )}>{seatId}</span>
                        {pricePerSeat > 0 && status !== "booked" && status !== "selected-by-others" && (
                          <span className="text-[8px] text-amber-700 dark:text-amber-300 mt-0.5 font-medium">${businessPrice}</span>
                        )}
                        {status === "booked" && (
                          <span className="text-[8px] text-red-600 dark:text-red-400 mt-0.5 font-semibold">Booked</span>
                        )}
                        {status === "selected-by-others" && (
                          <span className="text-[8px] text-amber-600 dark:text-amber-400 mt-0.5 font-semibold">Selecting...</span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Aisle */}
                <div className="w-12 h-16 border-l-2 border-r-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">··</span>
                </div>

                {/* Right side: 3 seats (DEF) */}
                <div className="flex gap-3">
                  {["D", "E", "F"].map((seat) => {
                    const seatId = `${rowIndex + 1}${seat}`
                    const status = getSeatStatus(seatId)

                    return (
                      <button
                        key={seat}
                        onClick={() => handleSeatClick(seatId)}
                        disabled={status === "booked" || status === "selected-by-others"}
                        className={cn(
                          "h-16 w-16 rounded-xl border-2 transition-all duration-200 relative group",
                          "flex flex-col items-center justify-center",
                          status === "available" &&
                            "bg-amber-50 border-amber-200 hover:border-amber-500 hover:bg-amber-100 hover:scale-105 cursor-pointer dark:bg-amber-950 dark:border-amber-800",
                          status === "selected" &&
                            "bg-accent border-accent text-accent-foreground scale-105 shadow-xl shadow-accent/30 ring-2 ring-accent/50",
                          status === "selected-by-others" &&
                            "bg-amber-50 border-amber-300 cursor-not-allowed opacity-75 dark:bg-amber-950/30 dark:border-amber-800/50 animate-pulse",
                          status === "booked" &&
                            "bg-red-50 border-red-300 cursor-not-allowed opacity-75 dark:bg-red-950/30 dark:border-red-800/50",
                        )}
                      >
                        {status === "booked" ? (
                          <X className="h-6 w-6 text-red-500 dark:text-red-400" />
                        ) : status === "selected-by-others" ? (
                          <Armchair className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <Armchair
                            className={cn("h-6 w-6 transition-transform", status === "selected" && "scale-110")}
                          />
                        )}
                        <span className={cn(
                          "text-[10px] font-bold mt-1",
                          status === "booked" && "text-red-600 dark:text-red-400",
                          status === "selected-by-others" && "text-amber-700 dark:text-amber-300"
                        )}>{seatId}</span>
                        {pricePerSeat > 0 && status !== "booked" && status !== "selected-by-others" && (
                          <span className="text-[8px] text-amber-700 dark:text-amber-300 mt-0.5 font-medium">${businessPrice}</span>
                        )}
                        {status === "booked" && (
                          <span className="text-[8px] text-red-600 dark:text-red-400 mt-0.5 font-semibold">Booked</span>
                        )}
                        {status === "selected-by-others" && (
                          <span className="text-[8px] text-amber-600 dark:text-amber-400 mt-0.5 font-semibold">Selecting...</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Economy Class Section */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-sm">Economy Class</span>
            <div className="flex items-center gap-3">
              {pricePerSeat > 0 && (
                <span className="text-sm font-semibold text-muted-foreground">${economyPrice}/seat</span>
              )}
              <div className="flex gap-2 text-muted-foreground">
                <Monitor className="h-4 w-4" />
                <Wifi className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {Array.from({ length: 16 }).map((_, rowIndex) => {
              const actualRow = rowIndex + 5
              return (
                <div key={rowIndex} className="flex items-center gap-2">
                  <div className="w-8 text-center font-bold text-xs text-muted-foreground">{actualRow}</div>

                  {/* Left side: 3 seats */}
                  <div className="flex gap-2">
                    {["A", "B", "C"].map((seat) => {
                      const seatId = `${actualRow}${seat}`
                      const status = getSeatStatus(seatId)

                      return (
                        <button
                          key={seat}
                          onClick={() => handleSeatClick(seatId)}
                          disabled={status === "booked" || status === "selected-by-others"}
                          className={cn(
                            "h-12 w-12 rounded-lg border-2 transition-all duration-200",
                            "flex flex-col items-center justify-center text-xs",
                            status === "available" &&
                              "bg-muted border-border hover:border-primary hover:bg-primary/10 hover:scale-105 cursor-pointer",
                            status === "selected" &&
                              "bg-accent border-accent text-accent-foreground scale-105 shadow-lg",
                            status === "selected-by-others" &&
                              "bg-orange-50 border-orange-300 cursor-not-allowed opacity-75 dark:bg-orange-950/30 dark:border-orange-800/50 animate-pulse",
                            status === "booked" &&
                              "bg-red-50 border-red-300 cursor-not-allowed opacity-75 dark:bg-red-950/30 dark:border-red-800/50",
                          )}
                        >
                          {status === "booked" ? (
                            <X className="h-4 w-4 text-red-500 dark:text-red-400" />
                          ) : status === "selected-by-others" ? (
                            <Armchair className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          ) : (
                            <Armchair className={cn("h-4 w-4", status === "selected" && "scale-110")} />
                          )}
                          <span className={cn(
                            "text-[9px] font-medium",
                            status === "booked" && "text-red-600 dark:text-red-400",
                            status === "selected-by-others" && "text-orange-700 dark:text-orange-300"
                          )}>{seatId}</span>
                          {pricePerSeat > 0 && status !== "booked" && status !== "selected-by-others" && (
                            <span className="text-[7px] text-muted-foreground mt-0.5">${economyPrice}</span>
                          )}
                          {status === "booked" && (
                            <span className="text-[7px] text-red-600 dark:text-red-400 mt-0.5 font-semibold">Booked</span>
                          )}
                          {status === "selected-by-others" && (
                            <span className="text-[7px] text-orange-600 dark:text-orange-400 mt-0.5 font-semibold">Selecting...</span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Aisle */}
                  <div className="w-10 h-12 border-l-2 border-r-2 border-dashed border-muted-foreground/20" />

                  {/* Right side: 3 seats */}
                  <div className="flex gap-2">
                    {["D", "E", "F"].map((seat) => {
                      const seatId = `${actualRow}${seat}`
                      const status = getSeatStatus(seatId)

                      return (
                        <button
                          key={seat}
                          onClick={() => handleSeatClick(seatId)}
                          disabled={status === "booked" || status === "selected-by-others"}
                          className={cn(
                            "h-12 w-12 rounded-lg border-2 transition-all duration-200",
                            "flex flex-col items-center justify-center text-xs",
                            status === "available" &&
                              "bg-muted border-border hover:border-primary hover:bg-primary/10 hover:scale-105 cursor-pointer",
                            status === "selected" &&
                              "bg-accent border-accent text-accent-foreground scale-105 shadow-lg",
                            status === "selected-by-others" &&
                              "bg-orange-50 border-orange-300 cursor-not-allowed opacity-75 dark:bg-orange-950/30 dark:border-orange-800/50 animate-pulse",
                            status === "booked" &&
                              "bg-red-50 border-red-300 cursor-not-allowed opacity-75 dark:bg-red-950/30 dark:border-red-800/50",
                          )}
                        >
                          {status === "booked" ? (
                            <X className="h-4 w-4 text-red-500 dark:text-red-400" />
                          ) : status === "selected-by-others" ? (
                            <Armchair className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          ) : (
                            <Armchair className={cn("h-4 w-4", status === "selected" && "scale-110")} />
                          )}
                          <span className={cn(
                            "text-[9px] font-medium",
                            status === "booked" && "text-red-600 dark:text-red-400",
                            status === "selected-by-others" && "text-orange-700 dark:text-orange-300"
                          )}>{seatId}</span>
                          {pricePerSeat > 0 && status !== "booked" && status !== "selected-by-others" && (
                            <span className="text-[7px] text-muted-foreground mt-0.5">${economyPrice}</span>
                          )}
                          {status === "booked" && (
                            <span className="text-[7px] text-red-600 dark:text-red-400 mt-0.5 font-semibold">Booked</span>
                          )}
                          {status === "selected-by-others" && (
                            <span className="text-[7px] text-orange-600 dark:text-orange-400 mt-0.5 font-semibold">Selecting...</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded border-2 border-border bg-muted"></div>
            <span className="text-xs text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded border-2 border-accent bg-accent"></div>
            <span className="text-xs text-muted-foreground">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/50 animate-pulse flex items-center justify-center">
              <Armchair className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs text-muted-foreground">Selecting...</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded border-2 border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800/50 flex items-center justify-center">
              <X className="h-3 w-3 text-red-500 dark:text-red-400" />
            </div>
            <span className="text-xs text-muted-foreground">Booked</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

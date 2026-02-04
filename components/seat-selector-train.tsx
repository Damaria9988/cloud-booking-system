"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Armchair, Wifi, Plug, Coffee, X } from "lucide-react"
import { toast } from "sonner"

interface SeatSelectorTrainProps {
  selectedSeats: string[]
  onSeatSelect: (seats: string[]) => void
  bookedSeats?: string[]
  seatsSelectedByOthers?: string[]
  totalSeats?: number
  pricePerSeat?: number
  maxSeats?: number
}

export function SeatSelectorTrain({ selectedSeats, onSeatSelect, bookedSeats = [], seatsSelectedByOthers = [], totalSeats = 50, pricePerSeat = 0, maxSeats }: SeatSelectorTrainProps) {
  const maxSelectableSeats = maxSeats || totalSeats
  // Calculate rows and seats per row based on totalSeats (assuming 3-2 layout: 5 seats per row)
  const seatsPerRow = 5
  const rows = Math.ceil(totalSeats / seatsPerRow)
  const seatLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"]

  const handleSeatClick = (seatId: string) => {
    if (bookedSeats.includes(seatId)) return
    if (seatsSelectedByOthers.includes(seatId)) {
      toast.warning("This seat is being selected by another user")
      return
    }
    if (selectedSeats.includes(seatId)) {
      onSeatSelect(selectedSeats.filter((s) => s !== seatId))
    } else {
      // Limit selection to number of passengers (maxSeats)
      if (selectedSeats.length < maxSelectableSeats) {
        onSeatSelect([...selectedSeats, seatId])
      } else {
        toast.info(`You can only select ${maxSelectableSeats} seat${maxSelectableSeats > 1 ? 's' : ''} for ${maxSelectableSeats} passenger${maxSelectableSeats > 1 ? 's' : ''}`)
      }
    }
  }

  const getSeatStatus = (seatId: string) => {
    if (bookedSeats.includes(seatId)) return "booked"
    if (selectedSeats.includes(seatId)) return "selected"
    if (seatsSelectedByOthers.includes(seatId)) return "selected-by-others"
    return "available"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Armchair className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Select Your Train Seats</CardTitle>
              <p className="text-sm text-muted-foreground">AC Chair Car - 3-2 Seating</p>
            </div>
          </div>
          <Badge variant="outline" className="text-base">
            {selectedSeats.length} / {maxSelectableSeats}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Coach B3 - Premium AC</span>
            <div className="flex gap-3">
              <Wifi className="h-4 w-4 text-primary" />
              <Plug className="h-4 w-4 text-primary" />
              <Coffee className="h-4 w-4 text-primary" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {Array.from({ length: rows }).map((_, rowIndex) => {
            const rowSeatStart = rowIndex * seatsPerRow
            const seatsInThisRow = Math.min(seatsPerRow, totalSeats - rowSeatStart)
            
            return (
            <div key={rowIndex}>
              <div className="flex items-center gap-3">
                <div className="w-8 text-center font-bold text-sm text-muted-foreground">{seatLabels[rowIndex]}</div>

                {/* Left side: 3 seats */}
                <div className="flex gap-2">
                  {[1, 2, 3].map((colIndex) => {
                    const seatNumber = rowSeatStart + colIndex
                    if (seatNumber > totalSeats) return null
                    const seatId = `${seatLabels[rowIndex]}${colIndex}`
                    const status = getSeatStatus(seatId)

                    return (
                      <button
                        key={colIndex}
                        onClick={() => handleSeatClick(seatId)}
                        disabled={status === "booked" || status === "selected-by-others"}
                        className={cn(
                          "h-12 w-12 rounded-lg border-2 transition-all duration-200 relative group",
                          "flex flex-col items-center justify-center text-xs",
                          status === "available" &&
                            "bg-muted border-border hover:border-primary hover:bg-primary/10 hover:scale-105 cursor-pointer",
                          status === "selected" &&
                            "bg-accent border-accent text-accent-foreground scale-105 shadow-xl shadow-accent/30",
                          status === "selected-by-others" &&
                            "bg-amber-50 border-amber-300 cursor-not-allowed opacity-75 dark:bg-amber-950/30 dark:border-amber-800/50 animate-pulse",
                        status === "booked" &&
                          "bg-red-50 border-red-300 cursor-not-allowed opacity-75 dark:bg-red-950/30 dark:border-red-800/50",
                        )}
                      >
                        {status === "booked" ? (
                          <X className="h-4 w-4 text-red-500 dark:text-red-400" />
                        ) : status === "selected-by-others" ? (
                          <Armchair className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <Armchair
                            className={cn("h-4 w-4 transition-transform", status === "selected" && "scale-110")}
                          />
                        )}
                        <span className={cn(
                          "text-[9px] font-medium",
                          status === "booked" && "text-red-600 dark:text-red-400",
                          status === "selected-by-others" && "text-amber-700 dark:text-amber-300"
                        )}>{seatId}</span>
                        {pricePerSeat > 0 && status !== "booked" && status !== "selected-by-others" && (
                          <span className="text-[7px] text-muted-foreground mt-0.5">${pricePerSeat.toFixed(0)}</span>
                        )}
                        {status === "booked" && (
                          <span className="text-[7px] text-red-600 dark:text-red-400 mt-0.5 font-semibold">Booked</span>
                        )}
                        {status === "selected-by-others" && (
                          <span className="text-[7px] text-amber-600 dark:text-amber-400 mt-0.5 font-semibold">Selecting...</span>
                        )}
                      </button>
                    )
                  }).filter(Boolean)}
                </div>

                {/* Aisle */}
                <div className="w-16 border-l-2 border-r-2 border-dashed border-muted-foreground/20 h-12 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">≡</span>
                </div>

                {/* Right side: 2 seats */}
                <div className="flex gap-2">
                  {[4, 5].map((colIndex) => {
                    const seatNumber = rowSeatStart + colIndex
                    if (seatNumber > totalSeats) return null
                    const seatId = `${seatLabels[rowIndex]}${colIndex}`
                    const status = getSeatStatus(seatId)

                    return (
                      <button
                        key={colIndex}
                        onClick={() => handleSeatClick(seatId)}
                        disabled={status === "booked" || status === "selected-by-others"}
                        className={cn(
                          "h-12 w-12 rounded-lg border-2 transition-all duration-200 relative group",
                          "flex flex-col items-center justify-center text-xs",
                          status === "available" &&
                            "bg-muted border-border hover:border-primary hover:bg-primary/10 hover:scale-105 cursor-pointer",
                          status === "selected" &&
                            "bg-accent border-accent text-accent-foreground scale-105 shadow-xl shadow-accent/30",
                          status === "selected-by-others" &&
                            "bg-amber-50 border-amber-300 cursor-not-allowed opacity-75 dark:bg-amber-950/30 dark:border-amber-800/50 animate-pulse",
                        status === "booked" &&
                          "bg-red-50 border-red-300 cursor-not-allowed opacity-75 dark:bg-red-950/30 dark:border-red-800/50",
                        )}
                      >
                        {status === "booked" ? (
                          <X className="h-4 w-4 text-red-500 dark:text-red-400" />
                        ) : status === "selected-by-others" ? (
                          <Armchair className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <Armchair
                            className={cn("h-4 w-4 transition-transform", status === "selected" && "scale-110")}
                          />
                        )}
                        <span className={cn(
                          "text-[9px] font-medium",
                          status === "booked" && "text-red-600 dark:text-red-400",
                          status === "selected-by-others" && "text-amber-700 dark:text-amber-300"
                        )}>{seatId}</span>
                        {pricePerSeat > 0 && status !== "booked" && status !== "selected-by-others" && (
                          <span className="text-[7px] text-muted-foreground mt-0.5">${pricePerSeat.toFixed(0)}</span>
                        )}
                        {status === "booked" && (
                          <span className="text-[7px] text-red-600 dark:text-red-400 mt-0.5 font-semibold">Booked</span>
                        )}
                        {status === "selected-by-others" && (
                          <span className="text-[7px] text-amber-600 dark:text-amber-400 mt-0.5 font-semibold">Selecting...</span>
                        )}
                      </button>
                    )
                  }).filter(Boolean)}
                </div>
              </div>

              {/* Table indicator every 2 rows */}
              {rowIndex % 2 === 1 && rowIndex < rows - 1 && (
                <div className="ml-10 mt-2 mb-2 h-1 w-64 bg-primary/20 rounded-full" />
              )}
            </div>
            )
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-8 flex items-center justify-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded border-2 border-border bg-muted"></div>
            <span className="text-xs text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded border-2 border-accent bg-accent"></div>
            <span className="text-xs text-muted-foreground">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/50 animate-pulse flex items-center justify-center">
              <Armchair className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs text-muted-foreground">Selecting...</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded border-2 border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800/50 flex items-center justify-center">
              <X className="h-4 w-4 text-red-500 dark:text-red-400" />
            </div>
            <span className="text-xs text-muted-foreground">Booked</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Armchair, Wifi, Monitor, Coffee, X } from "lucide-react"
import { toast } from "sonner"

interface SeatSelectorBusProps {
  selectedSeats: string[]
  onSeatSelect: (seats: string[]) => void
  bookedSeats?: string[]
  seatsSelectedByOthers?: string[]
  totalSeats?: number
  pricePerSeat?: number
  maxSeats?: number
}

export function SeatSelectorBus({ selectedSeats, onSeatSelect, bookedSeats = [], seatsSelectedByOthers = [], totalSeats = 48, pricePerSeat = 0, maxSeats }: SeatSelectorBusProps) {
  const maxSelectableSeats = maxSeats || totalSeats
  // Calculate rows and seats per row based on totalSeats (assuming 2-2 layout: 4 seats per row)
  const seatsPerRow = 4
  const rows = Math.ceil(totalSeats / seatsPerRow)
  const seatLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"]

  // Helper function to convert seat ID (UI format like "A1", "B2") to seat number (DB format like "1", "2")
  const seatIdToNumber = (seatId: string): string => {
    const rowLabel = seatId.charAt(0)
    const colIndex = parseInt(seatId.slice(1))
    const rowIndex = seatLabels.indexOf(rowLabel)
    if (rowIndex === -1 || isNaN(colIndex)) return seatId // Return as-is if invalid
    
    // Calculate actual seat number: (rowIndex * seatsPerRow) + colIndex
    const seatNumber = (rowIndex * seatsPerRow) + colIndex
    return seatNumber.toString()
  }

  // Helper function to convert seat number (DB format like "1", "2") to seat ID (UI format like "A1", "B2")
  const seatNumberToId = (seatNumber: string): string => {
    const num = parseInt(seatNumber)
    if (isNaN(num) || num < 1 || num > totalSeats) return seatNumber // Return as-is if invalid
    
    const rowIndex = Math.floor((num - 1) / seatsPerRow)
    const colIndex = ((num - 1) % seatsPerRow) + 1
    const rowLabel = seatLabels[rowIndex] || seatNumber.charAt(0)
    
    return `${rowLabel}${colIndex}`
  }

  // Booked seats are now always in UI format from the API
  // No conversion needed - use them directly
  const bookedSeatIds = bookedSeats || []
  

  // Convert seatsSelectedByOthers to UI format if needed
  const seatsSelectedByOthersIds = seatsSelectedByOthers.map(seat => {
    if (/[A-Z]/.test(seat)) return seat
    return seatNumberToId(seat)
  })

  const handleSeatClick = (seatId: string) => {
    console.log("[SeatSelector] Seat clicked:", seatId, "Is booked?", bookedSeatIds.includes(seatId))
    
    if (bookedSeatIds.includes(seatId)) {
      toast.error(`Seat ${seatId} is already booked and cannot be selected`)
      return
    }
    
    if (seatsSelectedByOthersIds.includes(seatId)) {
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
    if (bookedSeatIds.includes(seatId)) return "booked"
    if (selectedSeats.includes(seatId)) return "selected"
    if (seatsSelectedByOthersIds.includes(seatId)) return "selected-by-others"
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
              <CardTitle>Select Your Bus Seats</CardTitle>
              <p className="text-sm text-muted-foreground">2-2 Seater Luxury Coach</p>
            </div>
          </div>
          <Badge variant="outline" className="text-base">
            {selectedSeats.length} / {maxSelectableSeats}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Driver section */}
        <div className="mb-8">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Armchair className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span className="font-semibold text-sm">Driver</span>
                <p className="text-xs text-muted-foreground">Front of Bus</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Wifi className="h-5 w-5 text-primary" />
              <Monitor className="h-5 w-5 text-primary" />
              <Coffee className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {Array.from({ length: rows }).map((_, rowIndex) => {
            const rowSeatStart = rowIndex * seatsPerRow
            const seatsInThisRow = Math.min(seatsPerRow, totalSeats - rowSeatStart)
            
            return (
            <div key={rowIndex} className="flex items-center gap-3">
              <div className="w-8 text-center font-bold text-sm text-muted-foreground">{seatLabels[rowIndex]}</div>

              {/* Left side: 2 seats */}
              <div className="flex gap-3">
                {[1, 2].map((colIndex) => {
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
                        "h-14 w-14 rounded-lg border-2 transition-all duration-200 relative group",
                        "flex flex-col items-center justify-center",
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
                        <>
                          <X className="h-5 w-5 text-red-500 dark:text-red-400" />
                          <span className="text-[10px] font-medium mt-0.5 text-red-600 dark:text-red-400">{seatId}</span>
                          <span className="text-[8px] text-red-600 dark:text-red-400 mt-0.5 font-semibold">Booked</span>
                        </>
                      ) : status === "selected-by-others" ? (
                        <>
                          <Armchair className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          <span className="text-[10px] font-medium mt-0.5 text-amber-700 dark:text-amber-300">{seatId}</span>
                          <span className="text-[8px] text-amber-600 dark:text-amber-400 mt-0.5 font-semibold">Selecting...</span>
                        </>
                      ) : (
                        <>
                          <Armchair className={cn("h-5 w-5 transition-transform", status === "selected" && "scale-110")} />
                          <span className="text-[10px] font-medium mt-0.5">{seatId}</span>
                          {pricePerSeat > 0 && (
                            <span className="text-[8px] text-muted-foreground mt-0.5">${pricePerSeat.toFixed(0)}</span>
                          )}
                        </>
                      )}
                    </button>
                  )
                }).filter(Boolean)}
              </div>

              {/* Aisle */}
              <div className="w-10 border-l-2 border-r-2 border-dashed border-muted-foreground/20 h-14 flex items-center justify-center">
                <span className="text-xs text-muted-foreground rotate-90 whitespace-nowrap">Aisle</span>
              </div>

              {/* Right side: 2 seats */}
              <div className="flex gap-3">
                {[3, 4].map((colIndex) => {
                  const seatNumber = rowSeatStart + colIndex
                  if (seatNumber > totalSeats) return null
                  const seatId = `${seatLabels[rowIndex]}${colIndex}`
                  const status = getSeatStatus(seatId)

                  return (
                    <button
                      key={colIndex}
                      onClick={() => handleSeatClick(seatId)}
                      disabled={status === "booked"}
                      className={cn(
                        "h-14 w-14 rounded-lg border-2 transition-all duration-200 relative group",
                        "flex flex-col items-center justify-center",
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
                        <X className="h-5 w-5 text-red-500 dark:text-red-400" />
                      ) : status === "selected-by-others" ? (
                        <Armchair className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Armchair className={cn("h-5 w-5 transition-transform", status === "selected" && "scale-110")} />
                      )}
                      <span className={cn(
                        "text-[10px] font-medium mt-0.5",
                        status === "booked" && "text-red-600 dark:text-red-400",
                        status === "selected-by-others" && "text-amber-700 dark:text-amber-300"
                      )}>{seatId}</span>
                      {pricePerSeat > 0 && status !== "booked" && status !== "selected-by-others" && (
                        <span className="text-[8px] text-muted-foreground mt-0.5">${pricePerSeat.toFixed(0)}</span>
                      )}
                      {status === "booked" && (
                        <span className="text-[8px] text-red-600 dark:text-red-400 mt-0.5 font-semibold">Booked</span>
                      )}
                      {status === "selected-by-others" && (
                        <span className="text-[8px] text-amber-600 dark:text-amber-400 mt-0.5 font-semibold">Selecting...</span>
                      )}
                    </button>
                  )
                }).filter(Boolean)}
              </div>
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

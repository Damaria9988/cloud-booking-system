"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Armchair, Wifi, X } from "lucide-react"

interface SeatSelectorProps {
  selectedSeats: string[]
  onSeatSelect: (seats: string[]) => void
}

export function SeatSelector({ selectedSeats, onSeatSelect }: SeatSelectorProps) {
  // Generate seat layout (12 rows x 4 columns)
  const rows = 12
  const columns = 4

  // Simulate some booked seats
  const bookedSeats = ["A1", "A2", "B3", "C2", "D4", "E1", "F3", "G2", "H1"]

  const seatLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

  const handleSeatClick = (seatId: string) => {
    if (bookedSeats.includes(seatId)) return

    if (selectedSeats.includes(seatId)) {
      onSeatSelect(selectedSeats.filter((s) => s !== seatId))
    } else {
      if (selectedSeats.length < 6) {
        onSeatSelect([...selectedSeats, seatId])
      }
    }
  }

  const getSeatStatus = (seatId: string) => {
    if (bookedSeats.includes(seatId)) return "booked"
    if (selectedSeats.includes(seatId)) return "selected"
    return "available"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Select Your Seats</CardTitle>
          <Badge variant="outline">{selectedSeats.length} / 6 selected</Badge>
        </div>
        <div className="flex items-center gap-6 text-sm mt-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-muted border-2 border-border" />
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-accent border-2 border-accent" />
            <span className="text-muted-foreground">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-red-50 border-2 border-red-300 dark:bg-red-950/30 dark:border-red-800/50 flex items-center justify-center">
              <X className="h-4 w-4 text-red-500 dark:text-red-400" />
            </div>
            <span className="text-muted-foreground">Booked</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Driver section */}
        <div className="mb-8">
          <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
            <div className="flex items-center gap-2">
              <Armchair className="h-5 w-5 text-primary" />
              <span className="font-medium text-sm">Driver</span>
            </div>
            <Wifi className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Seat Grid */}
        <div className="space-y-4">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-4">
              <div className="w-8 text-center font-mono font-medium text-sm text-muted-foreground">
                {seatLabels[rowIndex]}
              </div>

              <div className="flex-1 grid grid-cols-4 gap-4">
                {Array.from({ length: columns }).map((_, colIndex) => {
                  const seatId = `${seatLabels[rowIndex]}${colIndex + 1}`
                  const status = getSeatStatus(seatId)

                  return (
                    <button
                      key={colIndex}
                      onClick={() => handleSeatClick(seatId)}
                      disabled={status === "booked"}
                      className={cn(
                        "h-14 w-full rounded-lg border-2 transition-all duration-200 relative group",
                        "flex items-center justify-center",
                        status === "available" &&
                          "bg-muted border-border hover:border-primary hover:bg-primary/10 cursor-pointer",
                        status === "selected" && "bg-accent border-accent text-accent-foreground scale-105 shadow-lg",
                        status === "booked" &&
                          "bg-red-50 border-red-300 cursor-not-allowed opacity-75 dark:bg-red-950/30 dark:border-red-800/50",
                      )}
                    >
                      {status === "booked" ? (
                        <>
                          <X className="h-6 w-6 text-red-500 dark:text-red-400" />
                          <span className="absolute bottom-1 text-xs font-medium text-red-600 dark:text-red-400">{seatId}</span>
                          <span className="absolute top-1 text-[8px] text-red-600 dark:text-red-400 font-semibold">Booked</span>
                        </>
                      ) : (
                        <>
                          <Armchair className={cn("h-6 w-6 transition-transform", status === "selected" && "scale-110")} />
                          <span className="absolute bottom-1 text-xs font-medium">{seatId}</span>
                        </>
                      )}

                      {/* Hover tooltip */}
                      {status === "available" && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Click to select
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Info box */}
        <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Note:</span> You can select up to 6 seats per booking. Seats
            with better view and comfort may have additional charges.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

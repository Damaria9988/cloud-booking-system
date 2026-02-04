"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Download, MoreVertical, CheckCircle2, X, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"

interface BookingMobileCardProps {
  booking: any
  onCancelBooking: (booking: any) => void
  onRefund: (booking: any) => void
  onMarkAsCompleted: (booking: any) => void
}

export function BookingMobileCard({
  booking,
  onCancelBooking,
  onRefund,
  onMarkAsCompleted,
}: BookingMobileCardProps) {
  const router = useRouter()
  const [openDropdown, setOpenDropdown] = useState(false)

  const handleViewDetails = () => {
    if (typeof window !== 'undefined' && router) {
      try {
        router.prefetch(`/admin/bookings/${booking.id}`)
      } catch (err) {
        // Silently handle prefetch errors
      }
      router.push(`/admin/bookings/${booking.id}`)
    }
  }

  const handleDownloadTicket = () => {
    try {
      toast.info("Generating ticket PDF...")
      window.open(`/booking/ticket?pnr=${booking.pnr}`, '_blank')
    } catch (err) {
      toast.error("Failed to download ticket")
    }
  }

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "-"
    
    let date: Date
    try {
      if (typeof dateValue === 'string') {
        const trimmedValue = dateValue.trim()
        
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
          date = new Date(trimmedValue + 'T00:00:00')
        } else if (/^\d{4}-\d{2}-\d{2}\s/.test(trimmedValue)) {
          date = new Date(trimmedValue)
        } else if (trimmedValue.includes('T')) {
          date = new Date(trimmedValue)
        } else {
          date = new Date(trimmedValue)
        }
      } else if (dateValue instanceof Date) {
        date = dateValue
      } else {
        date = new Date(dateValue)
      }
      
      if (isNaN(date.getTime())) {
        return "-"
      }
      
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      return "-"
    }
  }

  const travelDate = booking.travelDate || booking.travel_date || booking.date
  const today = new Date().toISOString().split('T')[0]
  const isTravelDatePassed = travelDate && travelDate <= today
  const isCompleted = booking.status === "completed"
  const isCancelled = booking.status === "cancelled"

  return (
    <Card className="border">
      <CardContent className="p-4 space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-sm font-semibold">BK{booking.id}</div>
            <div className="text-xs text-muted-foreground mt-0.5">PNR: {booking.pnr}</div>
            {booking.tripType === "round-trip" && (
              <Badge variant="outline" className="text-xs mt-1">
                {booking.isReturn ? "Return" : "Outbound"}
              </Badge>
            )}
          </div>
          <Badge
            variant={
              isCompleted
                ? "default"
                : booking.status === "pending"
                ? "secondary"
                : isCancelled
                ? "destructive"
                : "default"
            }
            className={`text-xs ${
              isCompleted
                ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
                : ""
            }`}
          >
            {isCompleted 
              ? "completed" 
              : isCancelled
              ? "cancelled"
              : booking.status === "pending"
              ? "pending"
              : "confirmed"}
          </Badge>
        </div>

        {/* Customer Info */}
        <div className="border-t pt-3">
          <div className="text-xs text-muted-foreground mb-1">Customer</div>
          <div className="font-medium text-sm">{booking.userName || "Guest User"}</div>
          <div className="text-xs text-muted-foreground">{booking.userEmail || "-"}</div>
        </div>

        {/* Route & Type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Route</div>
            <div className="text-sm">
              {booking.fromCity || booking.from} → {booking.toCity || booking.to}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Type</div>
            <Badge variant="outline" className="capitalize text-xs">
              {booking.transportType || 'bus'}
            </Badge>
          </div>
        </div>

        {/* Travel Date & Amount */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Travel Date</div>
            <div className="text-sm">{formatDate(travelDate)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Amount</div>
            <div className="font-medium text-sm">
              ₹{(booking.finalAmount || booking.amount || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>

        {/* Seats */}
        <div>
          <div className="text-xs text-muted-foreground mb-1">Seats</div>
          <div className="flex flex-wrap gap-1">
            {(booking.seats || booking.seatNumbers || []).map((seat: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0">
                {seat}
              </Badge>
            ))}
          </div>
        </div>

        {/* Payment Status */}
        {booking.paymentStatus && isCancelled && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Payment Status</div>
            <Badge variant="outline" className="text-xs">
              {booking.paymentStatus}
            </Badge>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={handleViewDetails}
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={handleDownloadTicket}
          >
            <Download className="h-4 w-4 mr-2" />
            Ticket
          </Button>
          <DropdownMenu open={openDropdown} onOpenChange={setOpenDropdown}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Mark as Completed */}
              {!isCancelled && (
                isCompleted ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="block w-full">
                        <DropdownMenuItem 
                          disabled={true}
                          className="opacity-50 cursor-not-allowed pointer-events-auto"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark as Completed
                        </DropdownMenuItem>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This booking is already completed</p>
                    </TooltipContent>
                  </Tooltip>
                ) : !isTravelDatePassed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="block w-full">
                        <DropdownMenuItem 
                          disabled={true}
                          className="opacity-50 cursor-not-allowed pointer-events-auto"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark as Completed
                        </DropdownMenuItem>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cannot mark as completed - travel date hasn&apos;t passed yet</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <DropdownMenuItem 
                    onClick={() => {
                      setOpenDropdown(false)
                      onMarkAsCompleted(booking)
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </DropdownMenuItem>
                )
              )}

              {/* Cancel Booking */}
              {!isCancelled && (
                isCompleted ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="block w-full">
                        <DropdownMenuItem 
                          className="text-destructive opacity-50 cursor-not-allowed pointer-events-auto"
                          disabled={true}
                          onSelect={(e) => e.preventDefault()}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel Booking
                        </DropdownMenuItem>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This booking is completed and cannot be cancelled</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => {
                      setOpenDropdown(false)
                      onCancelBooking(booking)
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel Booking
                  </DropdownMenuItem>
                )
              )}

              {/* Process Refund */}
              {booking.paymentStatus === "paid" && !isCancelled && !isCompleted && (
                <DropdownMenuItem 
                  onClick={() => {
                    setOpenDropdown(false)
                    onRefund(booking)
                  }}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Process Refund
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, Download, X, Edit, AlertTriangle, CheckCircle2, RefreshCw, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface BookingManagementProps {
  booking: {
    id: number
    pnr: string
    status: string
    operator: string
    from: string
    to: string
    date: string
    time: string
    seats: string[]
    amount?: number
    finalAmount?: number
    totalAmount?: number
  }
}

export function BookingManagement({ booking }: BookingManagementProps) {
  const [cancelling, setCancelling] = useState(false)
  const [modifying, setModifying] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  
  // Calculate amount safely
  const bookingAmount = booking.amount || booking.finalAmount || booking.totalAmount || 0

  const handleCancel = () => {
    setCancelDialogOpen(true)
  }

  const handleCancelConfirm = async () => {
    setCancelDialogOpen(false)
    setCancelling(true)
    const loadingToast = toast.loading("Cancelling booking...")
    
    try {
      const response = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: "PATCH",
      })

      if (!response.ok) {
        const data = await response.json()
        const errorMsg = data.error || "Failed to cancel booking"
        toast.error(errorMsg, { id: loadingToast })
        return
      }

      const data = await response.json()
      toast.success(data.message || "Booking cancelled successfully! Refund will be processed in 5-7 business days.", { id: loadingToast })
      
      // Reload page to update booking status after a short delay
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      console.error("Cancel booking error:", err)
      toast.error(err instanceof Error ? err.message : "Failed to cancel booking. Please try again.", { id: loadingToast })
    } finally {
      setCancelling(false)
    }
  }

  const [modifyDialogOpen, setModifyDialogOpen] = useState(false)
  const [modificationType, setModificationType] = useState<"seats" | "date">("seats")
  const [newSeats, setNewSeats] = useState<string[]>([])
  const [newDate, setNewDate] = useState("")

  const handleModify = async () => {
    setModifying(true)
    const loadingToast = toast.loading("Modifying booking...")
    
    try {
      const body: any = {}
      
      if (modificationType === "seats" && newSeats.length > 0) {
        body.newSeats = newSeats
      } else if (modificationType === "date" && newDate) {
        body.newTravelDate = newDate
      } else {
        toast.error("Please provide modification details", { id: loadingToast })
        return
      }

      const response = await fetch(`/api/bookings/${booking.id}/modify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to modify booking")
      }

      toast.success("Booking modified successfully! Check your email for updated ticket.", { id: loadingToast })
      setModifyDialogOpen(false)
      // Reload page to update booking details
      window.location.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to modify booking. Please try again.", { id: loadingToast })
    } finally {
      setModifying(false)
    }
  }

  const getStatusBadge = () => {
    switch (booking.status) {
      case "upcoming":
        return <Badge className="bg-green-500">Confirmed</Badge>
      case "completed":
        return <Badge variant="secondary">Completed</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg">{booking.operator}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  PNR: <span className="font-mono font-medium">{booking.pnr}</span>
                </p>
              </div>
              {getStatusBadge()}
            </div>

            <div className="flex items-center gap-4">
              <div>
                <div className="text-sm text-muted-foreground">From</div>
                <div className="font-medium">{booking.from}</div>
              </div>
              <div className="w-12 h-px bg-border" />
              <div>
                <div className="text-sm text-muted-foreground">To</div>
                <div className="font-medium">{booking.to}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{booking.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{booking.time}</span>
              </div>
              <div>Seats: {booking.seats.join(", ")}</div>
            </div>

            {booking.status === "upcoming" && (
              <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <div className="text-sm">
                  <div className="font-medium">Web Check-in Available</div>
                  <div className="text-muted-foreground text-xs">Check in 2 hours before departure</div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:w-48 flex flex-col justify-between gap-4 lg:border-l lg:pl-6">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="text-2xl font-bold text-primary">
                ${(booking.amount || booking.finalAmount || booking.totalAmount || 0).toFixed(2)}
              </div>
            </div>

            {booking.status === "upcoming" && (
              <div className="flex flex-col gap-2">
                <Button size="sm" asChild>
                  <a href={`/booking/ticket?bookingId=${booking.id}`}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Ticket
                  </a>
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Modify Booking
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Modify Booking</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="newDate">New Travel Date</Label>
                        <Input
                          id="newDate"
                          type="date"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <div className="flex gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium">Modification Fee: $25</div>
                            <div className="text-muted-foreground text-xs">
                              Date change fee + fare difference (if any)
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button className="w-full" onClick={handleModify} disabled={modifying}>
                        {modifying ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Confirm Modification"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <X className="mr-2 h-4 w-4" />
                      Cancel Booking
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Booking</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="flex gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                          <div className="text-sm space-y-2">
                            <div className="font-medium">Cancellation Policy</div>
                            <div className="text-muted-foreground text-xs space-y-1">
                              <div>• Cancellation fee: $20</div>
                              <div>• Refundable amount: ${(bookingAmount - 20).toFixed(2)}</div>
                              <div>• Refund timeline: 5-7 business days</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button variant="destructive" className="w-full" onClick={handleCancel} disabled={cancelling}>
                        {cancelling ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Confirm Cancellation"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {booking.status === "completed" && (
              <Button variant="outline" size="sm" asChild>
                <a href={`/booking/ticket?pnr=${booking.pnr}`} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Download Receipt
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* Cancel Booking Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>No, Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel Booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

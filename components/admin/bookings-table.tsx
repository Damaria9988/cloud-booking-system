"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { usePolling } from "@/hooks/use-polling"
import { toast } from "sonner"
import { BookingDialogs, BookingTableRow, BookingMobileCard, useBookingActions } from "./bookings"

interface BookingsTableProps {
  statusFilter?: string
  searchQuery?: string
}

export function BookingsTable({ statusFilter, searchQuery = "" }: BookingsTableProps) {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBookings = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)
      
      const url = statusFilter 
        ? `/api/admin/bookings?status=${statusFilter}`
        : "/api/admin/bookings"
      
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch bookings")
      }

      setBookings(data.bookings || [])
      setLoading(false)
    } catch (err) {
      console.error("Error fetching bookings:", err)
      toast.error("Failed to load bookings")
      setLoading(false)
    }
  }, [statusFilter])

  // Booking action handlers
  const {
    actionLoading,
    bookingToAction,
    cancelDialogOpen,
    refundDialogOpen,
    completeDialogOpen,
    setCancelDialogOpen,
    setRefundDialogOpen,
    setCompleteDialogOpen,
    handleCancelBooking,
    handleCancelConfirm,
    handleRefund,
    handleRefundConfirm,
    handleMarkAsCompleted,
    handleCompleteConfirm,
  } = useBookingActions({
    onSuccess: () => fetchBookings(true),
  })

  // Update local state for optimistic update
  const updateBookingStatus = useCallback((bookingId: number) => {
    setBookings(prevBookings => 
      prevBookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: "completed", bookingStatus: "completed" }
          : booking
      )
    )
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchBookings(true)
  }, [fetchBookings])

  // Polling every 5 seconds
  usePolling(() => fetchBookings(false), { 
    interval: 5000,
    refetchOnWindowFocus: false,
    refetchOnVisibilityChange: false
  })

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => fetchBookings(false)
    window.addEventListener("admin:refresh-bookings", handleRefresh)
    return () => window.removeEventListener("admin:refresh-bookings", handleRefresh)
  }, [fetchBookings])

  // Loading state
  if (loading) {
    return (
      <Card className="h-full flex flex-col overflow-hidden rounded-lg border py-0 gap-0">
        <CardContent className="p-0 flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  // Filter bookings based on search query
  const filteredBookings = bookings.filter((booking) => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase().trim()
    const pnr = booking.pnr?.toLowerCase() || ""
    const bookingId = booking.bookingId?.toLowerCase() || ""
    const userName = booking.userName?.toLowerCase() || ""
    const userEmail = booking.userEmail?.toLowerCase() || ""
    
    return (
      pnr.includes(query) ||
      bookingId.includes(query) ||
      userName.includes(query) ||
      userEmail.includes(query)
    )
  })

  // Empty state
  if (bookings.length === 0) {
    const emptyStateMessage = statusFilter === "completed" 
      ? "No completed bookings"
      : statusFilter === "cancelled"
      ? "No cancelled bookings"
      : "No bookings yet"
    
    const emptyStateDescription = statusFilter === "completed"
      ? "Completed bookings will appear here once trips have been completed."
      : statusFilter === "cancelled"
      ? "Cancelled bookings will appear here."
      : "Bookings will appear here once customers start making reservations."
    
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-medium text-muted-foreground mb-2">{emptyStateMessage}</p>
            <p className="text-sm text-muted-foreground">{emptyStateDescription}</p>
            {!statusFilter && (
              <p className="text-xs text-muted-foreground mt-4">
                💡 Create routes and schedules first, then users can book tickets.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-[calc(100vh-180px)] sm:h-[calc(100vh-220px)] min-h-[400px] py-0 gap-0">
      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
        {/* Desktop Table View - Hidden on mobile */}
        <div className="hidden lg:flex flex-col flex-1 overflow-hidden">
          {/* Fixed Table Header - pr-[17px] compensates for scrollbar width */}
          <div className="flex-shrink-0 border-b border-border bg-muted/50 pr-[17px]">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[7%]" />
                <col className="w-[9%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Booking ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Travel Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Seats</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Scrollable Table Body - overflow-y-scroll ensures scrollbar space is always reserved */}
          <div className="flex-1 overflow-y-scroll scrollbar-thin">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[7%]" />
                <col className="w-[9%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
              </colgroup>
              <tbody>
                {filteredBookings.length === 0 && searchQuery.trim() ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      No bookings found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <BookingTableRow
                      key={booking.id}
                      booking={booking}
                      onCancelBooking={handleCancelBooking}
                      onRefund={handleRefund}
                      onMarkAsCompleted={handleMarkAsCompleted}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View - Visible on mobile and tablet */}
        <div className="lg:hidden flex-1 overflow-y-auto">
          {filteredBookings.length === 0 && searchQuery.trim() ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No bookings found matching "{searchQuery}"
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {filteredBookings.map((booking) => (
                <BookingMobileCard
                  key={booking.id}
                  booking={booking}
                  onCancelBooking={handleCancelBooking}
                  onRefund={handleRefund}
                  onMarkAsCompleted={handleMarkAsCompleted}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Dialogs */}
      <BookingDialogs
        cancelDialogOpen={cancelDialogOpen}
        setCancelDialogOpen={setCancelDialogOpen}
        onCancelConfirm={handleCancelConfirm}
        refundDialogOpen={refundDialogOpen}
        setRefundDialogOpen={setRefundDialogOpen}
        onRefundConfirm={handleRefundConfirm}
        completeDialogOpen={completeDialogOpen}
        setCompleteDialogOpen={setCompleteDialogOpen}
        onCompleteConfirm={() => handleCompleteConfirm(updateBookingStatus)}
        bookingToAction={bookingToAction}
        actionLoading={actionLoading}
      />
    </Card>
  )
}

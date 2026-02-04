"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

interface UseBookingActionsProps {
  onSuccess?: () => void
}

export function useBookingActions({ onSuccess }: UseBookingActionsProps = {}) {
  const [actionLoading, setActionLoading] = useState(false)
  const [bookingToAction, setBookingToAction] = useState<any | null>(null)
  
  // Dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)

  const handleCancelBooking = useCallback((booking: any) => {
    setBookingToAction(booking)
    setCancelDialogOpen(true)
  }, [])

  const handleCancelConfirm = useCallback(async () => {
    if (!bookingToAction) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/bookings/${bookingToAction.id}/cancel`, {
        method: "PATCH",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel booking")
      }

      toast.success("Booking cancelled successfully")
      window.dispatchEvent(new CustomEvent("admin:refresh-stats"))
      setCancelDialogOpen(false)
      setBookingToAction(null)
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel booking")
    } finally {
      setActionLoading(false)
    }
  }, [bookingToAction, onSuccess])

  const handleRefund = useCallback((booking: any) => {
    setBookingToAction(booking)
    setRefundDialogOpen(true)
  }, [])

  const handleRefundConfirm = useCallback(async () => {
    if (!bookingToAction) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/bookings/${bookingToAction.id}/refund`, {
        method: "PATCH",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process refund")
      }

      toast.success("Refund processed successfully")
      window.dispatchEvent(new CustomEvent("admin:refresh-stats"))
      setRefundDialogOpen(false)
      setBookingToAction(null)
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process refund")
    } finally {
      setActionLoading(false)
    }
  }, [bookingToAction, onSuccess])

  const handleMarkAsCompleted = useCallback((booking: any) => {
    setBookingToAction(booking)
    setCompleteDialogOpen(true)
  }, [])

  const handleCompleteConfirm = useCallback(async (updateLocalState?: (bookingId: number) => void) => {
    if (!bookingToAction) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/bookings/${bookingToAction.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Non-JSON response received:", text.substring(0, 200))
        throw new Error("Server returned an invalid response. Please check the API route exists.")
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to mark booking as completed")
      }

      toast.success("Booking marked as completed successfully")
      updateLocalState?.(bookingToAction.id)
      window.dispatchEvent(new CustomEvent("admin:refresh-stats"))
      setCompleteDialogOpen(false)
      setBookingToAction(null)
      onSuccess?.()
    } catch (err) {
      if (err instanceof SyntaxError) {
        toast.error("Server error: Invalid response format. Please check if the API route exists.")
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to mark booking as completed")
      }
    } finally {
      setActionLoading(false)
    }
  }, [bookingToAction, onSuccess])

  const closeDialogs = useCallback(() => {
    setCancelDialogOpen(false)
    setRefundDialogOpen(false)
    setCompleteDialogOpen(false)
    setBookingToAction(null)
  }, [])

  return {
    // State
    actionLoading,
    bookingToAction,
    cancelDialogOpen,
    refundDialogOpen,
    completeDialogOpen,
    
    // Setters
    setCancelDialogOpen,
    setRefundDialogOpen,
    setCompleteDialogOpen,
    
    // Handlers
    handleCancelBooking,
    handleCancelConfirm,
    handleRefund,
    handleRefundConfirm,
    handleMarkAsCompleted,
    handleCompleteConfirm,
    closeDialogs,
  }
}

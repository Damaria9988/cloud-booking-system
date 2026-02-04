"use client"

import { Loader2 } from "lucide-react"
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

interface BookingDialogsProps {
  // Cancel Dialog
  cancelDialogOpen: boolean
  setCancelDialogOpen: (open: boolean) => void
  onCancelConfirm: () => void
  
  // Refund Dialog
  refundDialogOpen: boolean
  setRefundDialogOpen: (open: boolean) => void
  onRefundConfirm: () => void
  
  // Complete Dialog
  completeDialogOpen: boolean
  setCompleteDialogOpen: (open: boolean) => void
  onCompleteConfirm: () => void
  
  // Shared
  bookingToAction: any | null
  actionLoading: boolean
}

export function BookingDialogs({
  cancelDialogOpen,
  setCancelDialogOpen,
  onCancelConfirm,
  refundDialogOpen,
  setRefundDialogOpen,
  onRefundConfirm,
  completeDialogOpen,
  setCompleteDialogOpen,
  onCompleteConfirm,
  bookingToAction,
  actionLoading,
}: BookingDialogsProps) {
  return (
    <>
      {/* Cancel Booking Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel booking <strong>BK{bookingToAction?.id}</strong>?
              <br />
              <br />
              <span className="text-destructive font-medium">
                This will free up the seats and mark payment as refunded. This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onCancelConfirm}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund Dialog */}
      <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to process a refund for booking <strong>BK{bookingToAction?.id}</strong>?
              <br />
              <br />
              Amount: <strong>₹{(bookingToAction?.finalAmount || bookingToAction?.amount || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onRefundConfirm}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process Refund"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as Completed Dialog */}
      <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Completed</AlertDialogTitle>
            <AlertDialogDescription>
              Mark booking <strong>BK{bookingToAction?.id}</strong> as completed?
              <br />
              <br />
              This indicates the trip has been completed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onCompleteConfirm}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Mark as Completed"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

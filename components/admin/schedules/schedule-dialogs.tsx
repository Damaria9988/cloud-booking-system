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

interface ScheduleDialogsProps {
  // Delete Dialog
  deleteDialogOpen: boolean
  setDeleteDialogOpen: (open: boolean) => void
  scheduleToDelete: any | null
  deleting: boolean
  onDeleteConfirm: () => void
  
  // Error Dialog
  errorDialogOpen: boolean
  setErrorDialogOpen: (open: boolean) => void
  errorMessage: string
}

export function ScheduleDialogs({
  deleteDialogOpen,
  setDeleteDialogOpen,
  scheduleToDelete,
  deleting,
  onDeleteConfirm,
  errorDialogOpen,
  setErrorDialogOpen,
  errorMessage,
}: ScheduleDialogsProps) {
  return (
    <>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the schedule for{" "}
              <strong>
                {scheduleToDelete?.from_city}, {scheduleToDelete?.from_state} → {scheduleToDelete?.to_city}, {scheduleToDelete?.to_state}
              </strong>
              {" "}on {scheduleToDelete?.travel_date ? new Date(scheduleToDelete.travel_date).toLocaleDateString() : "this date"}?
              <br />
              <br />
              <span className="text-destructive font-medium">
                This action cannot be undone. If the schedule has active bookings, they must be cancelled first.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Schedule"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>
              {errorMessage || "An error occurred"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialogOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

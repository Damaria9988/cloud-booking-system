"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
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
import { Route, formatLocation } from "./use-routes"

interface DeleteRouteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  route: Route | null
  onSuccess: () => void
}

export function DeleteRouteDialog({ open, onOpenChange, route, onSuccess }: DeleteRouteDialogProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDeleteConfirm = async () => {
    if (!route) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/routes/${route.id}`, {
        method: "DELETE",
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete route")
      }

      toast.success("Route deleted successfully")
      onSuccess()
      window.dispatchEvent(new CustomEvent("admin:refresh-stats"))
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete route")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Route</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the route from{" "}
            <strong>
              {formatLocation(route?.from_city || '', route?.from_state || '', route?.from_country)} → {formatLocation(route?.to_city || '', route?.to_state || '', route?.to_country)}
            </strong>?
            <br />
            <br />
            <span className="text-destructive font-medium">
              This will set the route to inactive. This action cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Route"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

"use client"

import { useRef } from "react"
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

interface PrintInstructionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instructions: string
  onPrint: () => void
  title?: string
}

/**
 * Reusable Print Instructions Dialog Component
 * 
 * Used for displaying print instructions before opening the print dialog.
 * Can be used for tickets, reports, or any other printable content.
 * 
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback when dialog open state changes
 * @param instructions - The instructions text to display
 * @param onPrint - Callback when user clicks "Open Print Dialog"
 * @param title - Optional custom title (defaults to "Print Instructions")
 */
export function PrintInstructionsDialog({
  open,
  onOpenChange,
  instructions,
  onPrint,
  title = "Print Instructions",
}: PrintInstructionsDialogProps) {
  // Track if user clicked print button (not cancelled or closed via ESC/outside click)
  const printClickedRef = useRef(false)

  const handlePrint = () => {
    // Mark that user clicked print
    printClickedRef.current = true
    // Close the dialog first
    onOpenChange(false)
    // Then trigger print after dialog closes
    setTimeout(() => {
      onPrint()
      printClickedRef.current = false
    }, 300)
  }

  const handleCancel = () => {
    // User cancelled - don't print
    printClickedRef.current = false
    onOpenChange(false)
  }

  // Handle dialog close events (ESC key, clicking outside, etc.)
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && open) {
      // Dialog is closing
      if (!printClickedRef.current) {
        // User didn't click print button - they cancelled or closed another way
        // Just close without printing
        onOpenChange(false)
      } else {
        // Print button was clicked - handlePrint already called onPrint
        // Just update the state
        onOpenChange(false)
      }
    } else {
      // Dialog is opening
      printClickedRef.current = false
      onOpenChange(newOpen)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">
            {instructions}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handlePrint}>
            Open Print Dialog
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

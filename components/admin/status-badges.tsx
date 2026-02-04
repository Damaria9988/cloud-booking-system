/**
 * Reusable status badge components
 * Used across admin pages for consistent status display
 */

import { Badge } from "@/components/ui/badge"

/**
 * Booking status badge component
 */
export function BookingStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "confirmed":
      return <Badge className="bg-green-500">Confirmed</Badge>
    case "completed":
      return <Badge className="bg-blue-500 text-white border-blue-600 hover:bg-blue-600">Completed</Badge>
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>
    case "pending":
      return <Badge variant="outline">Pending</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

/**
 * Payment status badge component
 */
export function PaymentStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-500">Paid</Badge>
    case "pending":
      return <Badge variant="outline">Pending</Badge>
    case "failed":
      return <Badge variant="destructive">Failed</Badge>
    case "refunded":
      return <Badge variant="secondary">Refunded</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

/**
 * Route status badge component
 */
export function RouteStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-500">Active</Badge>
    case "inactive":
      return <Badge variant="secondary">Inactive</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

/**
 * Schedule status badge component
 */
export function ScheduleStatusBadge({ isCancelled }: { isCancelled: boolean }) {
  if (isCancelled) {
    return <Badge variant="destructive">Cancelled</Badge>
  }
  return <Badge className="bg-green-500">Active</Badge>
}

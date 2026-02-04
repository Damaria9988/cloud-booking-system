/**
 * Booking Information Card Component
 * Displays booking ID, PNR, status, and dates
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badges"

interface BookingInfoCardProps {
  booking: {
    booking_id: string
    pnr: string
    booking_status: string
    payment_status: string
    travel_date?: string
    created_at?: string
  }
}

export function BookingInfoCard({ booking }: BookingInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Booking ID</p>
            <p className="font-mono font-semibold">{booking.booking_id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">PNR</p>
            <p className="font-mono font-semibold">{booking.pnr}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-1">
              <BookingStatusBadge status={booking.booking_status} />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Payment Status</p>
            <div className="mt-1">
              <PaymentStatusBadge status={booking.payment_status} />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Travel Date</p>
            <p className="font-semibold">
              {booking.travel_date
                ? new Date(booking.travel_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created At</p>
            <p className="font-semibold">
              {booking.created_at
                ? new Date(booking.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

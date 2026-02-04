/**
 * Route Information Card Component
 * Displays route details including origin, destination, operator, and times
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RouteInfoCardProps {
  booking: {
    from_city?: string
    from_state?: string
    from_country?: string
    to_city?: string
    to_state?: string
    to_country?: string
    operator_name?: string
    vehicle_type?: string
    departure_time?: string
    arrival_time?: string
  }
}

export function RouteInfoCard({ booking }: RouteInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">From</p>
            <p className="font-semibold">
              {booking.from_city}
              {booking.from_state && `, ${booking.from_state}`}
              {booking.from_country && `, ${booking.from_country}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">To</p>
            <p className="font-semibold">
              {booking.to_city}
              {booking.to_state && `, ${booking.to_state}`}
              {booking.to_country && `, ${booking.to_country}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Operator</p>
            <p className="font-semibold">{booking.operator_name || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Vehicle Type</p>
            <p className="font-semibold">{booking.vehicle_type || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Departure Time</p>
            <p className="font-semibold">{booking.departure_time || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Arrival Time</p>
            <p className="font-semibold">{booking.arrival_time || "N/A"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Customer Information Card Component
 * Displays customer/user information
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CustomerInfoCardProps {
  booking: {
    user_name?: string
    user_email?: string
    contact_email?: string
    contact_phone?: string
  }
}

export function CustomerInfoCard({ booking }: CustomerInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Name</p>
          <p className="font-semibold">{booking.user_name || "Guest User"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-semibold">{booking.user_email || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Contact Email</p>
          <p className="font-semibold">{booking.contact_email || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Contact Phone</p>
          <p className="font-semibold">{booking.contact_phone || "N/A"}</p>
        </div>
      </CardContent>
    </Card>
  )
}

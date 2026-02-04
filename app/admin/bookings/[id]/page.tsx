"use client"

import { AdminSidebar } from "@/components/admin-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  BookingInfoCard,
  RouteInfoCard,
  PassengerDetailsCard,
  CustomerInfoCard,
  PaymentInfoCard,
} from "@/components/admin/booking-details"

export default function AdminBookingDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params?.id ? parseInt(params.id as string) : null
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bookingId) {
      setLoading(false)
      return
    }

    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/admin/bookings/${bookingId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch booking")
        }
        const data = await response.json()
        setBooking(data.booking)
      } catch (error) {
        console.error("Error fetching booking:", error)
        toast.error("Failed to load booking details")
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [bookingId])

  if (loading) {
    return (
      <div className="flex min-h-screen bg-muted/30">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen bg-muted/30">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Booking not found</p>
                <Button onClick={() => router.push("/admin/bookings")} className="mt-4">
                  Back to Bookings
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }


  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/bookings")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <BookingInfoCard booking={booking} />
              <RouteInfoCard booking={booking} />
              <PassengerDetailsCard passengers={booking.passengers || []} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <CustomerInfoCard booking={booking} />
              <PaymentInfoCard booking={booking} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

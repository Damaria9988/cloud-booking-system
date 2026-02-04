"use client"

import { CheckCircle, Download, Eye, Plane, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function BookingSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bookingId = searchParams.get("bookingId")
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setError("Booking ID is missing")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/bookings/${bookingId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch booking")
        }

        // Format time
        const formatTime = (time: string) => {
          if (!time) return ""
          const [hours, minutes] = time.split(":")
          const hour = parseInt(hours)
          const ampm = hour >= 12 ? "PM" : "AM"
          const displayHour = hour % 12 || 12
          return `${displayHour}:${minutes} ${ampm}`
        }

        setBooking({
          ...data.booking,
          departureTime: formatTime(data.booking.departureTime),
          arrivalTime: formatTime(data.booking.arrivalTime),
        })
      } catch (err) {
        console.error("Error fetching booking:", err)
        setError(err instanceof Error ? err.message : "Failed to load booking")
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [bookingId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg mb-2">{error || "Booking not found"}</p>
          <Button asChild>
            <Link href="/bookings">View All Bookings</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/bookings")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Bookings
            </Button>
          </div>
          {/* Success Animation */}
          <div className="text-center mb-8 animate-in fade-in zoom-in duration-500">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-4xl font-bold text-pretty mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground text-lg">Your ticket has been booked successfully</p>
          </div>

          {/* Booking Details Card */}
          <Card className="mb-6 overflow-hidden border-2 shadow-xl">
            <div className="bg-gradient-to-r from-primary to-accent p-6 text-primary-foreground">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90">Booking ID</p>
                  <p className="text-2xl font-bold">{booking.bookingId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90">PNR</p>
                  <p className="text-2xl font-bold">{booking.pnr}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 text-lg font-medium">
                <span>{booking.from} → {booking.to}</span>
              </div>
            </div>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Passenger(s)</p>
                  <p className="font-semibold">
                    {booking.passengers?.map((p: any) => `${p.firstName} ${p.lastName}`).join(", ") || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seat(s)</p>
                  <p className="font-semibold">
                    {booking.passengers?.map((p: any) => p.seat).join(", ") || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold">{new Date(booking.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departure Time</p>
                  <p className="font-semibold">{booking.departureTime}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Operator</p>
                  <p className="font-semibold">{booking.operator}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">{booking.duration}</p>
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-2xl font-bold text-primary">${booking.finalAmount?.toFixed(2) || "0.00"}</span>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200 text-center">
                  Payment successful • Confirmation sent to your email
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Button asChild size="lg" className="gap-2">
              <Link href={`/booking/ticket?bookingId=${booking.id}`}>
                <Eye className="w-5 h-5" />
                View Ticket
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 bg-transparent">
              <Link href={`/booking/ticket?bookingId=${booking.id}`}>
                <Download className="w-5 h-5" />
                Download Ticket
              </Link>
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild variant="ghost" className="flex-1 gap-2">
              <Link href="/bookings">View All Bookings</Link>
            </Button>
            <Button asChild variant="ghost" className="flex-1 gap-2">
              <Link href="/search">
                <Plane className="w-4 h-4" />
                Book Another Trip
              </Link>
            </Button>
          </div>

          {/* Tips */}
          <Card className="mt-8 bg-gradient-to-br from-accent/10 to-primary/10">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Important Information</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Show your QR code ticket at the boarding gate</li>
                <li>• Arrive 30 minutes before departure time</li>
                <li>• Carry a valid government ID proof</li>
                <li>• Check your email for booking confirmation</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

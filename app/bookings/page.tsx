"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BookingManagement } from "@/components/booking-management"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, loading: authLoading } = useAuth()

  useEffect(() => {
    const fetchBookings = async () => {
      if (authLoading) return

      if (!isAuthenticated) {
        setError("Please login to view your bookings")
        setLoading(false)
        return
      }

      try {
        const response = await fetch("/api/bookings")
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch bookings")
        }

        // Format bookings
        const formattedBookings = (data.bookings || []).map((booking: any) => ({
          ...booking,
          status: booking.status === "confirmed" ? "upcoming" : booking.status,
          time: formatTime(booking.departureTime),
          amount: booking.finalAmount || booking.totalAmount || booking.amount || 0,
        }))

        setBookings(formattedBookings)
      } catch (err) {
        console.error("Error fetching bookings:", err)
        setError(err instanceof Error ? err.message : "Failed to load bookings")
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [isAuthenticated, authLoading])

  const formatTime = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading bookings...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive text-lg mb-2">{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-6xl px-4">
          <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-6 space-y-4">
              {bookings.filter((b) => b.status === "upcoming").length > 0 ? (
                bookings
                  .filter((b) => b.status === "upcoming")
                  .map((booking) => (
                    <BookingManagement key={booking.id} booking={booking} />
                  ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="text-muted-foreground">No upcoming bookings</div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-6 space-y-4">
              {bookings.filter((b) => b.status === "completed").length > 0 ? (
                bookings
                  .filter((b) => b.status === "completed")
                  .map((booking) => (
                    <BookingManagement key={booking.id} booking={booking} />
                  ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="text-muted-foreground">No completed bookings</div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="mt-6 space-y-4">
              {bookings.filter((b) => b.status === "cancelled").length > 0 ? (
                bookings
                  .filter((b) => b.status === "cancelled")
                  .map((booking) => (
                    <BookingManagement key={booking.id} booking={booking} />
                  ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="text-muted-foreground">No cancelled bookings</div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}

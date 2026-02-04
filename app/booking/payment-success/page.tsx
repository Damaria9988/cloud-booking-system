"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, XCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const paymentIntentId = searchParams.get("payment_intent")
    const paymentIntentClientSecret = searchParams.get("payment_intent_client_secret")
    const redirectStatus = searchParams.get("redirect_status")

    if (redirectStatus === "succeeded") {
      setStatus("success")
      setMessage("Payment successful! Your booking has been confirmed.")
      
      // Poll for booking creation (webhook might take a moment)
      if (paymentIntentId) {
        pollForBooking(paymentIntentId)
      }
    } else if (redirectStatus === "failed") {
      setStatus("error")
      setMessage("Payment failed. Please try again.")
    } else {
      setStatus("error")
      setMessage("Invalid payment status.")
    }
  }, [searchParams])

  const pollForBooking = async (paymentIntentId: string) => {
    let attempts = 0
    const maxAttempts = 10
    
    const poll = setInterval(async () => {
      attempts++
      
      try {
        const response = await fetch(`/api/bookings/by-payment/${paymentIntentId}`)
        if (response.ok) {
          const data = await response.json()
          setBookingId(data.booking.id)
          clearInterval(poll)
        } else if (attempts >= maxAttempts) {
          clearInterval(poll)
          setMessage("Booking confirmed but taking longer than expected. Check your bookings page.")
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          clearInterval(poll)
        }
      }
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">
            {status === "loading" && "Processing..."}
            {status === "success" && "Payment Successful!"}
            {status === "error" && "Payment Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            {status === "loading" && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
            {status === "error" && (
              <XCircle className="h-16 w-16 text-red-500" />
            )}

            <p className="text-center text-muted-foreground">{message}</p>

            {bookingId && (
              <p className="text-sm text-muted-foreground">
                Booking ID: <span className="font-mono font-semibold">{bookingId}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {status === "success" && bookingId && (
              <Button asChild size="lg" className="w-full">
                <Link href={`/booking/ticket?bookingId=${bookingId}`}>
                  View Ticket
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}

            {status === "success" && !bookingId && (
              <Button asChild size="lg" className="w-full">
                <Link href="/bookings">
                  View All Bookings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}

            {status === "error" && (
              <>
                <Button asChild size="lg" className="w-full">
                  <Link href="/search">Try Again</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link href="/">Go Home</Link>
                </Button>
              </>
            )}

            {status === "success" && (
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link href="/search">Book Another Trip</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface SimplePaymentFormProps {
  amount: number
  scheduleId: number
  seats: string[]
  passengers: Array<{
    firstName: string
    lastName: string
    age: number
    gender: string
  }>
  promoCode?: string
  onSuccess: (bookingId: number, pnr: string) => void
  onError?: (error: string) => void
}

export function SimplePaymentForm({
  amount,
  scheduleId,
  seats,
  passengers,
  promoCode,
  onSuccess,
  onError,
}: SimplePaymentFormProps) {
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  const handlePayment = async () => {
    setProcessing(true)

    try {
      const response = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scheduleId,
          seats,
          passengers,
          totalAmount: amount,
          promoCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Payment failed")
      }

      setSuccess(true)
      toast.success(data.message || "Payment successful!")
      
      // Wait a moment to show success state
      setTimeout(() => {
        onSuccess(data.booking.id, data.booking.pnr)
      }, 1000)
    } catch (error) {
      console.error("Payment error:", error)
      const errorMessage = error instanceof Error ? error.message : "Payment failed"
      toast.error(errorMessage)
      onError?.(errorMessage)
      setProcessing(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-green-600">Payment Successful!</h3>
              <p className="text-muted-foreground mt-2">
                Your booking has been confirmed. Redirecting to your ticket...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Confirm Payment
        </CardTitle>
        <CardDescription>
          Click below to confirm your booking. Payment will be processed instantly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Seats</span>
            <span className="font-medium">{seats.join(", ")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Passengers</span>
            <span className="font-medium">{passengers.length}</span>
          </div>
          {promoCode && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Promo Code</span>
              <span className="font-medium text-green-600">{promoCode}</span>
            </div>
          )}
          <div className="border-t pt-3">
            <div className="flex justify-between">
              <span className="font-semibold">Total Amount</span>
              <span className="text-2xl font-bold">₹{amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Instant Booking Confirmation</p>
              <p className="text-xs text-muted-foreground">
                Your booking will be confirmed immediately and you'll receive your digital ticket with QR code.
              </p>
            </div>
          </div>
        </div>

        {/* Pay Button */}
        <Button
          onClick={handlePayment}
          disabled={processing}
          className="w-full h-12 text-lg"
          size="lg"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Pay ₹{amount.toLocaleString()} Now
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By confirming, you agree to our terms and conditions
        </p>
      </CardContent>
    </Card>
  )
}

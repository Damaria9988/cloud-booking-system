"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tag, ArrowRight, Star, Loader2 } from "lucide-react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { isBusinessClassSeat, getSeatPrice, getSeatPriceBreakdown } from "@/lib/pricing"

interface BookingSummaryProps {
  trip: {
    id?: string
    operator: string
    from: string
    to: string
    date: string
    pricePerSeat: number
    scheduleId?: string
    mode?: string
  }
  selectedSeats: string[]
}

export function BookingSummary({ trip, selectedSeats }: BookingSummaryProps) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  
  // For flights, calculate business vs economy pricing
  const isFlightMode = trip.mode === "flight"
  
  const { businessSeats, economySeats, businessSubtotal, economySubtotal, subtotal } = useMemo(() => {
    if (!isFlightMode) {
      return {
        businessSeats: [],
        economySeats: selectedSeats,
        businessSubtotal: 0,
        economySubtotal: selectedSeats.length * trip.pricePerSeat,
        subtotal: selectedSeats.length * trip.pricePerSeat
      }
    }
    
    const business = selectedSeats.filter(isBusinessClassSeat)
    const economy = selectedSeats.filter(seat => !isBusinessClassSeat(seat))
    const businessTotal = business.reduce((sum, seat) => sum + getSeatPrice(seat, trip.pricePerSeat), 0)
    const economyTotal = economy.reduce((sum, seat) => sum + getSeatPrice(seat, trip.pricePerSeat), 0)
    
    return {
      businessSeats: business,
      economySeats: economy,
      businessSubtotal: businessTotal,
      economySubtotal: economyTotal,
      subtotal: businessTotal + economyTotal
    }
  }, [selectedSeats, trip.pricePerSeat, isFlightMode])
  // const tax = subtotal * 0.08 // 8% tax - Commented out
  
  // Winter discount commented out - no longer applies
  // // Check if it's winter season (December, January, February)
  // const travelDateObj = new Date(trip.date)
  // const month = travelDateObj.getMonth() + 1 // getMonth() returns 0-11
  // const isWinter = month === 12 || month === 1 || month === 2
  // const winterDiscountAmount = isWinter ? subtotal * 0.15 : 0
  
  // const total = subtotal + tax // Removed winter discount from total
  const total = subtotal // Total without tax

  // Promo code functionality commented out
  // const applyPromoCode = async () => {
  //   if (!promoCode.trim()) {
  //     setError("Please enter a promo code")
  //     return
  //   }

  //   setValidating(true)
  //   setError("")

  //   try {
  //     const response = await fetch("/api/promo-codes/validate", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         code: promoCode.trim(),
  //         subtotal,
  //       }),
  //     })

  //     if (!response.ok) {
  //       const data = await response.json()
  //       const errorMsg = data.error || "Invalid promo code"
  //       setError(errorMsg)
  //       toast.error(errorMsg)
  //       setDiscount(0)
  //       setDiscountAmount(0)
  //       setDiscountApplied(false)
  //       return
  //     }

  //     const data = await response.json()

  //     if (data.valid && data.promo) {
  //       const promo = data.promo
  //       if (promo.discountType === "percent") {
  //         setDiscount(promo.discountValue)
  //         setDiscountAmount(promo.discountAmount)
  //       } else {
  //         setDiscount(0)
  //         setDiscountAmount(promo.discountAmount)
  //       }
  //       setDiscountApplied(true)
  //       setError("")
  //       toast.success(`Promo code applied! You saved $${promo.discountAmount.toFixed(2)}`)
  //     } else {
  //       const errorMsg = "Invalid promo code"
  //       setError(errorMsg)
  //       toast.error(errorMsg)
  //       setDiscount(0)
  //       setDiscountAmount(0)
  //       setDiscountApplied(false)
  //     }
  //   } catch (err) {
  //     console.error("Promo code validation error:", err)
  //     const errorMsg = "Failed to validate promo code. Please try again."
  //     setError(errorMsg)
  //     toast.error(errorMsg)
  //     setDiscount(0)
  //     setDiscountAmount(0)
  //     setDiscountApplied(false)
  //   } finally {
  //     setValidating(false)
  //   }
  // }

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>Booking Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Trip Info */}
        <div className="space-y-3">
          <div>
            <div className="text-sm text-muted-foreground">Route</div>
            <div className="font-medium break-words">
              {trip.from} → {trip.to}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Date</div>
            <div className="font-medium">{trip.date}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Operator</div>
            <div className="font-medium">{trip.operator}</div>
          </div>
        </div>

        <Separator />

        {/* Selected Seats */}
        <div>
          <div className="text-sm text-muted-foreground mb-2">Selected Seats</div>
          {selectedSeats.length > 0 ? (
            <div className="space-y-2">
              {/* Business Class Seats */}
              {isFlightMode && businessSeats.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Star className="h-3 w-3 text-amber-500" />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Business</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {businessSeats.map((seat) => (
                      <Badge key={seat} className="text-xs bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700">
                        {seat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {/* Economy Class Seats */}
              {economySeats.length > 0 && (
                <div>
                  {isFlightMode && businessSeats.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Economy</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {economySeats.map((seat) => (
                      <Badge key={seat} variant="secondary" className="text-xs">
                        {seat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No seats selected</p>
          )}
        </div>

        <Separator />

        {/* Winter Discount Badge - Commented out */}
        {/* {isWinter && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                ❄️ Winter Special: 15% Off Automatically Applied!
              </span>
            </div>
          </div>
        )} */}

        {/* Promo Code section commented out */}

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-3">
          {/* Business Class breakdown for flights */}
          {isFlightMode && businessSeats.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <Star className="h-3 w-3" />
                Business ({businessSeats.length} {businessSeats.length === 1 ? "seat" : "seats"})
              </span>
              <span className="font-medium text-amber-700 dark:text-amber-300">${businessSubtotal.toFixed(2)}</span>
            </div>
          )}
          {/* Economy Class breakdown for flights */}
          {isFlightMode && economySeats.length > 0 && businessSeats.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Economy ({economySeats.length} {economySeats.length === 1 ? "seat" : "seats"})
              </span>
              <span className="font-medium">${economySubtotal.toFixed(2)}</span>
            </div>
          )}
          {/* Subtotal - show only for non-flights or when there's mixed seating */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Subtotal ({selectedSeats.length} {selectedSeats.length === 1 ? "seat" : "seats"})
            </span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>

          {/* Winter discount - Removed */}
          {/* Promo code discount - Commented out */}
          {/* {discountApplied && discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Promo Code Discount {discount > 0 ? `(${discount}%)` : ""}
              </span>
              <span className="font-medium text-accent">-${discountAmount.toFixed(2)}</span>
            </div>
          )} */}

          {/* Taxes & Fees - Commented out */}
          {/* <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxes & Fees</span>
            <span className="font-medium">{`$${tax.toFixed(2)}`}</span>
          </div> */}

          <Separator />

          <div className="flex justify-between text-lg">
            <span className="font-bold">Total</span>
            <span className="font-bold text-primary">{`$${total.toFixed(2)}`}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          disabled={selectedSeats.length === 0 || isNavigating}
          className="w-full h-12 bg-accent hover:bg-accent/90 group"
          size="lg"
          onClick={() => {
            setIsNavigating(true)
            const checkoutUrl = `/booking/checkout?seats=${encodeURIComponent(selectedSeats.join(","))}&pricePerSeat=${trip.pricePerSeat}&from=${encodeURIComponent(trip.from)}&to=${encodeURIComponent(trip.to)}&date=${encodeURIComponent(trip.date)}&operator=${encodeURIComponent(trip.operator)}&routeId=${trip.id}&scheduleId=${(trip as any).scheduleId || ""}`
            router.push(checkoutUrl)
          }}
        >
          {isNavigating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Proceeding to Payment...
            </>
          ) : (
            <>
              Proceed to Payment
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">Free cancellation up to 24 hours before departure</p>
      </CardContent>
    </Card>
  )
}

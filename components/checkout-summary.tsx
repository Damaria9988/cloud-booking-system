import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Bus, MapPin, Clock, Calendar } from "lucide-react"

interface CheckoutSummaryProps {
  bookingData: {
    trip: any
    seats: string[]
    pricePerSeat: number
    discount: number
    tax: number
  }
}

export function CheckoutSummary({ bookingData }: CheckoutSummaryProps) {
  const { trip, seats, pricePerSeat, discount, tax } = bookingData

  const subtotal = seats.length * pricePerSeat
  
  // Winter discount commented out - no longer applies
  // // Check if it's winter season (December, January, February)
  // // Safely parse date to prevent errors
  // let travelDateObj: Date
  // try {
  //   const dateStr = trip.date || trip.travelDate
  //   if (dateStr) {
  //     travelDateObj = new Date(dateStr)
  //     // Check if date is valid
  //     if (isNaN(travelDateObj.getTime())) {
  //       travelDateObj = new Date()
  //     }
  //   } else {
  //     travelDateObj = new Date()
  //   }
  // } catch {
  //   travelDateObj = new Date()
  // }
  // 
  // const month = travelDateObj.getMonth() + 1 // getMonth() returns 0-11
  // const isWinter = month === 12 || month === 1 || month === 2
  // const winterDiscountAmount = isWinter ? subtotal * 0.15 : 0
  
  const promoDiscountAmount = (subtotal * discount) / 100
  const totalDiscountAmount = promoDiscountAmount // Removed winter discount
  // const total = subtotal + tax - totalDiscountAmount // Taxes commented out
  const total = subtotal - totalDiscountAmount // Total without tax

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>Booking Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Trip Details */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Bus className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">{trip.operator}</h3>
              <Badge variant="secondary" className="mt-1 text-xs">
                {trip.type}
              </Badge>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">{trip.from}</div>
                <div className="text-muted-foreground">{trip.departureTime}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="font-medium">{trip.to}</div>
                <div className="text-muted-foreground">{trip.arrivalTime}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{trip.date}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{trip.duration}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Seats */}
        <div>
          <div className="text-sm font-semibold mb-2">Selected Seats</div>
          <div className="flex flex-wrap gap-2">
            {seats.map((seat) => (
              <Badge key={seat} variant="outline" className="text-sm">
                {seat}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Base Fare ({seats.length} {seats.length === 1 ? "seat" : "seats"})
            </span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>

          {/* Winter discount - Commented out */}
          {/* {isWinter && winterDiscountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Winter Discount (15%)</span>
              <span className="font-medium text-accent">-${winterDiscountAmount.toFixed(2)}</span>
            </div>
          )} */}

          {discount > 0 && promoDiscountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Promo Code Discount ({discount}%)</span>
              <span className="font-medium text-accent">-${promoDiscountAmount.toFixed(2)}</span>
            </div>
          )}

          {/* Taxes & Service Fee - Commented out */}
          {/* <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxes & Service Fee</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div> */}

          <Separator />

          <div className="flex justify-between">
            <span className="font-bold text-lg">Total Amount</span>
            <span className="font-bold text-lg text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="rounded-lg bg-muted/50 p-4">
          <h4 className="font-semibold text-sm mb-2">Cancellation Policy</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Free cancellation up to 24 hours before departure</li>
            <li>• 50% refund if cancelled 12-24 hours before</li>
            <li>• No refund if cancelled within 12 hours</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

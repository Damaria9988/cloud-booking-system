/**
 * Payment Information Card Component
 * Displays payment details including amounts and payment method
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PaymentInfoCardProps {
  booking: {
    total_amount?: number | string
    discount_amount?: number | string
    tax_amount?: number | string
    final_amount?: number | string
    payment_method?: string
  }
}

export function PaymentInfoCard({ booking }: PaymentInfoCardProps) {
  const formatCurrency = (amount: number | string | undefined) => {
    return parseFloat(String(amount || 0)).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="font-semibold text-lg">
            ₹{formatCurrency(booking.total_amount)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Discount</p>
          <p className="font-semibold">
            ₹{formatCurrency(booking.discount_amount)}
          </p>
        </div>
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground">Final Amount</p>
          <p className="font-semibold text-xl text-primary">
            ₹{formatCurrency(booking.final_amount)}
          </p>
        </div>
        {booking.payment_method && (
          <div>
            <p className="text-sm text-muted-foreground">Payment Method</p>
            <p className="font-semibold capitalize">{booking.payment_method}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

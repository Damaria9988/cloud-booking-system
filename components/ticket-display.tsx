"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Bus, Clock, Calendar, User, CreditCard, Hash } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import QRCode from "qrcode"

interface TicketDisplayProps {
  ticketData: {
    pnr: string
    bookingId: string
    trip: any
    passengers: any[]
    amount: number
    bookingDate: string
    qrCodeData?: string
  }
}

export function TicketDisplay({ ticketData }: TicketDisplayProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const [qrError, setQrError] = useState(false)

  useEffect(() => {
    // Generate QR code using qrcode library
    const generateQRCode = async () => {
      if (!qrCanvasRef.current) return

      try {
        // Use qrCodeData if available, otherwise use PNR
        const qrData = ticketData.qrCodeData || ticketData.pnr || ticketData.bookingId
        
        await QRCode.toCanvas(qrCanvasRef.current, qrData, {
          width: 200,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        })
        setQrError(false)
      } catch (err) {
        console.error("Error generating QR code:", err)
        setQrError(true)
        // Fallback: draw a simple error message
        if (qrCanvasRef.current) {
          const ctx = qrCanvasRef.current.getContext("2d")
          if (ctx) {
            ctx.fillStyle = "#f3f4f6"
            ctx.fillRect(0, 0, 200, 200)
            ctx.fillStyle = "#000000"
            ctx.font = "12px Arial"
            ctx.textAlign = "center"
            ctx.fillText("QR Code", 100, 95)
            ctx.fillText("Error", 100, 110)
          }
        }
      }
    }

    generateQRCode()
  }, [ticketData.pnr, ticketData.qrCodeData, ticketData.bookingId])

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">E-Ticket</h2>
            <p className="text-primary-foreground/80 text-sm mt-1">Keep this ticket safe for your journey</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-foreground/20 backdrop-blur-sm">
            <Bus className="h-7 w-7" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* PNR and Booking ID */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Hash className="h-3 w-3" />
              PNR Number
            </div>
            <div className="font-mono font-bold text-xl text-primary">{ticketData.pnr}</div>
          </div>
          <div className="space-y-1 text-right">
            <div className="text-xs text-muted-foreground">Booking ID</div>
            <div className="font-mono font-semibold">{ticketData.bookingId}</div>
          </div>
        </div>

        <Separator />

        {/* Trip Details */}
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-4">Journey Details</h3>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Bus className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">{ticketData.trip.operator}</div>
                <Badge variant="secondary" className="mt-1">
                  {ticketData.trip.type}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
              <div>
                <div className="text-sm text-muted-foreground mb-1">From</div>
                <div className="font-bold text-lg">{ticketData.trip.fromCode}</div>
                <div className="text-sm">{ticketData.trip.from}</div>
                <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {ticketData.trip.departureTime}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-16 h-px bg-border relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent" />
                </div>
                <div className="text-xs text-muted-foreground mt-2 whitespace-nowrap">{ticketData.trip.duration}</div>
              </div>

              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">To</div>
                <div className="font-bold text-lg">{ticketData.trip.toCode}</div>
                <div className="text-sm">{ticketData.trip.to}</div>
                <div className="text-sm text-muted-foreground mt-1 flex items-center justify-end gap-1">
                  <Clock className="h-3 w-3" />
                  {ticketData.trip.arrivalTime}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{ticketData.trip.date}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Passenger Details */}
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-4">Passenger Details</h3>
          <div className="space-y-3">
            {ticketData.passengers.map((passenger, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">{passenger.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {passenger.age} years • {passenger.gender}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Seat</div>
                  <Badge variant="outline" className="font-mono font-bold">
                    {passenger.seat}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* QR Code and Payment */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-4">Scan to Verify</h3>
            <div className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-border bg-muted/30">
              <canvas ref={qrCanvasRef} width={200} height={200} className="rounded-lg bg-white" />
              {qrError && (
                <p className="text-xs text-destructive mt-2 text-center">Failed to generate QR code</p>
              )}
              <p className="text-xs text-muted-foreground mt-3 text-center">Show this QR code at boarding</p>
              <p className="text-xs text-muted-foreground mt-1 text-center font-mono">{ticketData.pnr}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-4">Payment Information</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Total Amount Paid</div>
                    <div className="text-xs text-muted-foreground">Including all taxes</div>
                  </div>
                </div>
                <div className="font-bold text-xl text-primary">${ticketData.amount.toFixed(2)}</div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking Date</span>
                  <span className="font-medium">{ticketData.bookingDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status</span>
                  <Badge className="bg-green-500">Paid</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <span className="text-amber-600">⚠️</span>
            Important Information
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Carry a valid government ID proof during travel</li>
            <li>• Reach boarding point 15 minutes before departure</li>
            <li>• Cancellation available up to 24 hours before journey</li>
            <li>• Save or print this ticket for verification</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}

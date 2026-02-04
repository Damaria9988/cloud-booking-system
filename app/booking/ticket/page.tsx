"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TicketDisplay } from "@/components/ticket-display"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Download, Share2, Mail, Loader2, Printer } from "lucide-react"
import Link from "next/link"
import { useSearchParams, usePathname } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import QRCode from "qrcode"
import { PrintInstructionsDialog } from "@/components/print-instructions-dialog"
import { TicketShareMenu } from "@/components/ticket-share-menu"

export default function TicketPage() {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL IN CONSISTENT ORDER
  // Step 1: Next.js navigation hooks (must be called first)
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  // Step 2: All useState hooks (must be grouped together)
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null)
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [printInstructions, setPrintInstructions] = useState("")
  const [ticketUrl, setTicketUrl] = useState<string>("")
  const printDataRef = useRef<{ fileName: string; originalTitle: string } | null>(null) // Store print data in ref
  const shouldPrintRef = useRef(false) // Flag to control when to actually print
  
  // Step 3: Extract values from searchParams (non-hook code, safe to call after all hooks)
  const bookingId = searchParams.get("bookingId")
  const pnr = searchParams.get("pnr")
  
  // Generate ticket URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      setTicketUrl(window.location.href)
    }
  }, [pathname, searchParams])

  const handlePrint = () => {
    // Set document title before printing for better PDF filename
    if (booking && booking.passengers && booking.passengers.length > 0) {
      const fullName = booking.passengers[0].name || ''
      if (fullName) {
        const originalTitle = document.title
        const fileName = `${fullName} Ticket`
        document.title = fileName
        const titleTag = document.querySelector('title')
        if (titleTag) {
          titleTag.textContent = fileName
        }
        window.print()
        // Restore title after print dialog closes
        setTimeout(() => {
          document.title = originalTitle
          if (titleTag) {
            titleTag.textContent = originalTitle
          }
        }, 1000)
        return
      }
    }
    window.print()
  }

  const handleDownloadPDF = () => {
    // Set document title to use as PDF filename
    if (booking && booking.passengers && booking.passengers.length > 0) {
      // Extract name from passenger object
      // In booking state, passengers have a 'name' property (string like "John Doe")
      const passenger = booking.passengers[0]
      const fullName = passenger.name || ''
      const fileName = fullName ? `${fullName} Ticket` : 'Ticket'
      
      // Store original title to restore later
      const originalTitle = document.title
      
      // Use browser's native print-to-PDF feature
      const userAgent = navigator.userAgent.toLowerCase()
      const isChrome = userAgent.includes('chrome') && !userAgent.includes('edge')
      const isFirefox = userAgent.includes('firefox')
      const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome')
      const isEdge = userAgent.includes('edge')
      
      // Show helpful instructions based on browser
      let instructions = ''
      if (isChrome || isEdge) {
        instructions = `IMPORTANT: To remove "Ticket" and URL text from PDF:\n\n1. In the print dialog, click "More settings"\n2. UNCHECK "Headers and footers" (this removes unwanted text)\n3. Select "Save as PDF" or "Microsoft Print to PDF" as destination\n4. The filename will be "${fileName}.pdf"\n5. Click "Save" and choose location`
      } else if (isFirefox) {
        instructions = `IMPORTANT: To remove "Ticket" and URL text from PDF:\n\n1. In the print dialog, click "More Settings"\n2. UNCHECK "Print headers and footers" (this removes unwanted text)\n3. Select "Print to File" or "Save to PDF"\n4. The filename will be "${fileName}.pdf"\n5. Choose location and click "Save"`
      } else if (isSafari) {
        instructions = `To save as PDF on Mac:\n1. In the print dialog, click the PDF dropdown\n2. Select "Save as PDF"\n3. The filename will be "${fileName}.pdf"\n4. Choose location and click "Save"\n\nNote: In Safari, headers/footers are usually disabled by default.`
      } else {
        instructions = `IMPORTANT: To remove "Ticket" and URL text from PDF:\n\n1. In the print dialog, disable "Headers and footers" in settings\n2. Look for "Save as PDF" or "Print to File" option\n3. The filename will be "${fileName}.pdf"\n4. Select it and choose where to save\n5. Click Save`
      }
      
      // Show instructions dialog first - don't trigger print until user clicks button
      setPrintInstructions(instructions)
      
      // Store print data in ref (fileName and originalTitle)
      printDataRef.current = { fileName, originalTitle }
      shouldPrintRef.current = false // Reset flag - only set to true when user clicks button
      
      // Open the dialog - this should show BEFORE any print dialog
      setPrintDialogOpen(true)
    } else {
      // Fallback if booking not loaded
      window.print()
    }
  }

  // Set document title when booking is loaded for PDF filename
  useEffect(() => {
    if (booking && booking.passengers && booking.passengers.length > 0) {
      // Extract name from passenger object
      // In booking state, passengers have a 'name' property (string)
      const passenger = booking.passengers[0]
      const fullName = passenger.name || ''
      
      if (fullName) {
        const fileName = `${fullName} Ticket`
        document.title = fileName
        // Also update title tag directly
        const titleTag = document.querySelector('title')
        if (titleTag) {
          titleTag.textContent = fileName
        }
      }
    }
  }, [booking])

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId && !pnr) {
        setError("Booking ID or PNR is missing")
        setLoading(false)
        return
      }

      try {
        // Fetch by PNR if provided, otherwise by bookingId
        const url = pnr 
          ? `/api/bookings/pnr/${encodeURIComponent(pnr)}`
          : `/api/bookings/${bookingId}`
        
        const response = await fetch(url)
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

        // Format date
        const formatDate = (dateString: string) => {
          if (!dateString) return ""
          const date = new Date(dateString)
          return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        }

        const bookingData = data.booking

        // Format city codes (first 3 letters of city name)
        const getCityCode = (city: string) => {
          if (!city) return "N/A"
          return city
            .split(" ")[0]
            .substring(0, 3)
            .toUpperCase()
        }

        setBooking({
          pnr: bookingData.pnr,
          bookingId: bookingData.bookingId,
          trip: {
            operator: bookingData.operator,
            from: `${bookingData.from}${bookingData.fromState ? `, ${bookingData.fromState}` : ""}${bookingData.fromCountry ? `, ${bookingData.fromCountry}` : ""}`,
            fromCode: getCityCode(bookingData.from),
            to: `${bookingData.to}${bookingData.toState ? `, ${bookingData.toState}` : ""}${bookingData.toCountry ? `, ${bookingData.toCountry}` : ""}`,
            toCode: getCityCode(bookingData.to),
            departureTime: formatTime(bookingData.departureTime),
            arrivalTime: formatTime(bookingData.arrivalTime),
            date: formatDate(bookingData.date),
            duration: bookingData.duration || "N/A",
            type: bookingData.vehicleType || "Standard",
          },
          passengers: bookingData.passengers?.map((p: any) => ({
            name: `${p.firstName} ${p.lastName}`,
            age: p.age,
            gender: p.gender.charAt(0).toUpperCase() + p.gender.slice(1),
            seat: p.seat,
          })) || [],
          amount: parseFloat(bookingData.finalAmount || bookingData.totalAmount || "0"),
          bookingDate: new Date(bookingData.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          qrCodeData: bookingData.qrCodeData || bookingData.pnr,
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
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading ticket...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive text-lg mb-2">{error || "Ticket not found"}</p>
            <Button asChild>
              <Link href="/bookings">View All Bookings</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col print:bg-white">
        <div className="print:hidden">
          <Header />
        </div>

      <main className="flex-1 py-8 print:py-4">
        <div className="container mx-auto max-w-4xl px-4 print:px-2">
          {/* Success Message */}
          <Card className="mb-8 border-accent bg-accent/5 print:hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent/20">
                  <CheckCircle2 className="h-8 w-8 text-accent" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
                  <p className="text-muted-foreground">
                    Your ticket has been booked successfully.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-8 print:hidden">
            <Button onClick={handlePrint} className="flex-1 sm:flex-initial bg-transparent" variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print Ticket
            </Button>
            <Button onClick={handleDownloadPDF} className="flex-1 sm:flex-initial" variant="default">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            {/* Email Ticket button commented out */}
            {/* <Button className="flex-1 sm:flex-initial bg-transparent" variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Email Ticket
            </Button> */}
            {booking && ticketUrl && (
              <TicketShareMenu
                ticketUrl={ticketUrl}
                ticketTitle={
                  booking.passengers && booking.passengers.length > 0
                    ? `${booking.passengers[0].name} Ticket`
                    : "Travel Ticket"
                }
                ticketText={
                  booking.trip
                    ? `Check out my travel ticket: ${booking.trip.from} → ${booking.trip.to} on ${booking.trip.date}`
                    : undefined
                }
              />
            )}
          </div>

          {/* Ticket Display */}
          <div className="ticket-content">
            <TicketDisplay ticketData={{ ...booking, qrCodeImage }} />
          </div>

          {/* Next Steps */}
          <Card className="mt-8 print:hidden">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">What's Next?</h3>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    1
                  </div>
                  <p>
                    <strong>Save your ticket:</strong> Download or take a screenshot of your ticket for easy access.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    2
                  </div>
                  <p>
                    <strong>Arrive early:</strong> Reach the boarding point at least 15 minutes before departure.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    3
                  </div>
                  <p>
                    <strong>Show QR code:</strong> Simply show the QR code on your ticket to the driver for
                    verification.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    4
                  </div>
                  <p>
                    <strong>Carry ID proof:</strong> Keep a valid government ID with you during travel.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Print-only footer */}
          <div className="hidden print:block mt-8 pt-4 border-t text-center text-xs text-gray-600">
            <p>This is a computer-generated e-ticket and does not require a signature.</p>
            <p className="mt-1">For support, contact support@travelflow.com or call 1-800-TRAVEL</p>
            <p className="mt-1">Printed on: {new Date().toLocaleString()}</p>
          </div>

          {/* Additional Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 print:hidden">
            <Button asChild variant="outline" className="flex-1 bg-transparent">
              <Link href="/bookings">View All Bookings</Link>
            </Button>
            <Button asChild className="flex-1 bg-accent hover:bg-accent/90">
              <Link href="/search">Book Another Trip</Link>
            </Button>
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>

      {/* Print Instructions Dialog */}
      <PrintInstructionsDialog
        open={printDialogOpen}
        onOpenChange={(open) => {
          setPrintDialogOpen(open)
          if (!open) {
            // Dialog is closing
            // Only trigger print if user clicked the action button
            if (shouldPrintRef.current && printDataRef.current) {
              const { fileName, originalTitle } = printDataRef.current
              
              // Set document title which browsers use as default PDF filename
              document.title = fileName
              const titleTag = document.querySelector('title')
              if (titleTag) {
                titleTag.textContent = fileName
              }
              
              // Wait a bit for dialog to fully close, then open print dialog
              setTimeout(() => {
                window.print()
                
                // Restore original title after print dialog opens
                setTimeout(() => {
                  document.title = originalTitle
                  const titleTag = document.querySelector('title')
                  if (titleTag) {
                    titleTag.textContent = originalTitle
                  }
                }, 1000)
              }, 300)
            }
            
            // Reset everything
            shouldPrintRef.current = false
            printDataRef.current = null
          }
        }}
        instructions={printInstructions}
        onPrint={() => {
          // Set flag to indicate user wants to print
          // The onOpenChange handler will check this flag and trigger print
          shouldPrintRef.current = true
          // Close the dialog - onOpenChange will handle the rest
          setPrintDialogOpen(false)
        }}
      />
    </div>
  )
}

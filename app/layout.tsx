import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/sonner"
import { DevConsoleFilter } from "@/components/dev-console-filter"

// <CHANGE> Using Inter for a more modern, professional look
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ['system-ui', 'arial'],
})

export const metadata: Metadata = {
  // <CHANGE> Updated metadata for ticket booking system
  title: "Damaria's Travel - Modern Cloud Ticket Booking",
  description:
    "Fast, affordable, and transparent ticket booking for buses, trains, and flights. Real-time availability, instant bookings, and exclusive student discounts.",
  generator: "v0.app",
  keywords: ["ticket booking", "bus tickets", "train tickets", "flight booking", "student discount", "travel"],
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
      },
      {
        url: "/icon-light-32x32.png",
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [
      {
        url: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/icon.svg",
  },
  openGraph: {
    title: "Damaria's Travel - Modern Cloud Ticket Booking",
    description: "Fast, affordable, and transparent ticket booking for buses, trains, and flights.",
    type: "website",
    images: [
      {
        url: "/icon.svg",
        width: 1200,
        height: 630,
        alt: "Damaria's Travel - Airplane Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Damaria's Travel - Modern Cloud Ticket Booking",
    description: "Fast, affordable, and transparent ticket booking for buses, trains, and flights.",
    images: ["/icon.svg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-sans antialiased`}>
        <DevConsoleFilter />
        <AuthProvider>
          {children}
          <Toaster />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}

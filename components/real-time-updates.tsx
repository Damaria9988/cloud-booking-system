"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Clock, AlertCircle, CheckCircle, Info } from "lucide-react"
import { useEffect, useState } from "react"

interface Update {
  id: string
  type: "info" | "warning" | "success" | "alert"
  message: string
  timestamp: Date
}

export function RealTimeUpdates({ bookingId }: { bookingId: string }) {
  const [updates, setUpdates] = useState<Update[]>([
    {
      id: "1",
      type: "success",
      message: "Booking confirmed! Your e-ticket has been sent to your email.",
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: "2",
      type: "info",
      message: "Web check-in is now available for your trip.",
      timestamp: new Date(Date.now() - 1800000),
    },
  ])

  // Simulate real-time updates via WebSocket/SSE
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly add updates (simulating WebSocket messages)
      if (Math.random() > 0.7) {
        const newUpdate: Update = {
          id: Date.now().toString(),
          type: ["info", "warning", "success"][Math.floor(Math.random() * 3)] as any,
          message: [
            "Your vehicle is on time and tracking normally.",
            "Weather conditions are favorable for your journey.",
            "Reminder: Carry a valid ID for boarding.",
          ][Math.floor(Math.random() * 3)],
          timestamp: new Date(),
        }
        setUpdates((prev) => [newUpdate, ...prev].slice(0, 5))
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [bookingId])

  const getIcon = (type: Update["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-600" />
      case "alert":
        return <Bell className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getBgColor = (type: Update["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-500/10 border-green-500/20"
      case "warning":
        return "bg-amber-500/10 border-amber-500/20"
      case "alert":
        return "bg-red-500/10 border-red-500/20"
      default:
        return "bg-blue-500/10 border-blue-500/20"
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Live Updates</h3>
        <Badge variant="outline" className="gap-1">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live
        </Badge>
      </div>

      <div className="space-y-3">
        {updates.map((update) => (
          <div key={update.id} className={`p-3 rounded-lg border ${getBgColor(update.type)}`}>
            <div className="flex gap-3">
              {getIcon(update.type)}
              <div className="flex-1">
                <div className="text-sm font-medium">{update.message}</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {update.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

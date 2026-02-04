"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, TrendingDown } from "lucide-react"
import { useState } from "react"

interface PriceCalendarProps {
  selectedDate: string
  onDateSelect: (date: string) => void
  mode: string
}

export function PriceCalendar({ selectedDate, onDateSelect, mode }: PriceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Generate price data for demo
  const generatePriceData = () => {
    const prices: { [key: string]: number } = {}
    const today = new Date()
    for (let i = 0; i < 60; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]
      // Generate random prices with some variation
      const basePrice = mode === "flight" ? 150 : mode === "train" ? 50 : 35
      const variation = Math.random() * 50 - 25
      prices[dateStr] = Math.round(basePrice + variation)
    }
    return prices
  }

  const [priceData] = useState(generatePriceData())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }

    // Add all days in month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const days = getDaysInMonth(currentMonth)
  const today = new Date().toISOString().split("T")[0]

  const getLowestPrice = () => Math.min(...Object.values(priceData))
  const lowestPrice = getLowestPrice()

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const prevMonth = () => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    if (prev >= new Date()) {
      setCurrentMonth(prev)
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Flexible Dates - Find Best Prices</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-32 text-center">
            {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} />
          }

          const dateStr = day.toISOString().split("T")[0]
          const price = priceData[dateStr]
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === today
          const isPast = dateStr < today
          const isLowest = price === lowestPrice

          return (
            <button
              key={dateStr}
              onClick={() => !isPast && onDateSelect(dateStr)}
              disabled={isPast}
              className={`relative p-2 rounded-lg text-center transition-all ${
                isPast
                  ? "opacity-40 cursor-not-allowed"
                  : isSelected
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : isLowest
                      ? "bg-green-500/10 hover:bg-green-500/20 border border-green-500/30"
                      : "hover:bg-muted"
              } ${isToday && !isSelected ? "ring-2 ring-primary/30" : ""}`}
            >
              <div className="text-sm font-medium">{day.getDate()}</div>
              {price && !isPast && (
                <div className="text-xs mt-1 flex items-center justify-center gap-0.5">
                  {isLowest && <TrendingDown className="h-3 w-3 text-green-600" />}${price}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-green-500/20 border border-green-500/30" />
          <span className="text-muted-foreground">Best Price</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded ring-2 ring-primary/30" />
          <span className="text-muted-foreground">Today</span>
        </div>
      </div>
    </Card>
  )
}

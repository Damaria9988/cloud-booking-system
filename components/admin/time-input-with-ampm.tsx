"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TimeInputWithAmPmProps {
  id: string
  name: string
  label: string
  required?: boolean
  disabled?: boolean
  defaultValue?: string
  className?: string
}

// Convert 24-hour time to 12-hour format with AM/PM
function formatTo12Hour(time24: string): string {
  if (!time24) return ""
  const [hours, minutes] = time24.split(":")
  if (!hours || !minutes) return ""
  
  const hour24 = parseInt(hours, 10)
  if (isNaN(hour24)) return ""
  
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
  const ampm = hour24 >= 12 ? "PM" : "AM"
  
  return `${hour12}:${minutes} ${ampm}`
}

export function TimeInputWithAmPm({
  id,
  name,
  label,
  required = false,
  disabled = false,
  defaultValue = "",
  className = "",
}: TimeInputWithAmPmProps) {
  const [time24, setTime24] = useState(defaultValue)
  const [displayTime, setDisplayTime] = useState("")

  useEffect(() => {
    if (defaultValue) {
      setTime24(defaultValue)
      setDisplayTime(formatTo12Hour(defaultValue))
    }
  }, [defaultValue])

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTime24(value)
    setDisplayTime(formatTo12Hour(value))
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <div className="space-y-1">
        <Input
          id={id}
          name={name}
          type="time"
          value={time24}
          onChange={handleTimeChange}
          required={required}
          disabled={disabled}
        />
        {time24 && (
          <p className="text-xs font-medium text-primary">
            {displayTime}
          </p>
        )}
        {!time24 && (
          <p className="text-xs text-muted-foreground">
            Format: 24-hour (e.g., 10:00 = 10:00 AM, 14:30 = 2:30 PM)
          </p>
        )}
      </div>
    </div>
  )
}

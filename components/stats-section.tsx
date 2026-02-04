"use client"

import { TrendingUp, Users, Clock, Award } from "lucide-react"
import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { useSocketIO } from "@/hooks/use-socketio"
import type { SocketIOMessage } from "@/hooks/use-socketio"

function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const endRef = useRef<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    // Only animate if we have a valid end value and it's different from previous
    if (!isVisible || !end || end <= 0) return
    
    // If end value changed, reset and re-animate
    if (endRef.current !== end) {
      endRef.current = end
      setCount(0)
      
      let startTime: number | null = null
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime
        const progress = Math.min((currentTime - startTime) / duration, 1)

        setCount(Math.floor(progress * end))

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    }
  }, [isVisible, end, duration])

  return (
    <div ref={ref} className="text-3xl font-bold">
      {count.toLocaleString()}
      {suffix}
    </div>
  )
}

export function StatsSection() {
  const [totalUsers, setTotalUsers] = useState<number | null>(null)

  // Function to fetch user count
  const fetchUserCount = useCallback(async () => {
    try {
      const response = await fetch("/api/stats")
      const data = await response.json()
      if (data.totalUsers !== undefined) {
        setTotalUsers(data.totalUsers)
      }
    } catch (error) {
      console.error("Failed to fetch user count:", error)
      // Don't set fallback - let it show "Loading..." or handle error state
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchUserCount()
  }, [fetchUserCount])

  // Handle real-time user count updates via Socket.IO
  const handleStatsUpdate = useCallback((message: SocketIOMessage) => {
    if (message.type === 'user_count_updated') {
      // Refresh user count when user count is updated
      fetchUserCount()
    } else if (message.type === 'user_created') {
      // Refresh user count when new user is created
      fetchUserCount()
    }
  }, [fetchUserCount])

  // Set up Socket.IO connection for real-time stats updates
  const { subscribe, unsubscribe, isConnected } = useSocketIO({
    autoConnect: true,
    autoReconnect: true,
    onMessage: handleStatsUpdate,
    showToastNotifications: false,
  })

  // Subscribe to public stats channel for user count updates
  useEffect(() => {
    if (isConnected) {
      subscribe('public:stats')
      return () => unsubscribe('public:stats')
    }
  }, [isConnected, subscribe, unsubscribe])

  const stats = useMemo(() => [
    {
      icon: Users,
      value: totalUsers !== null ? `${totalUsers.toLocaleString()}+` : "0+",
      numericValue: totalUsers !== null ? totalUsers : 0, // Use 0 as default instead of undefined
      label: "Active Travelers",
      color: "text-chart-1",
      bgGradient: "from-chart-1/20 to-chart-1/5",
    },
    {
      icon: Clock,
      value: "< 2 min",
      label: "Average Booking Time",
      color: "text-chart-2",
      bgGradient: "from-chart-2/20 to-chart-2/5",
    },
    {
      icon: TrendingUp,
      value: "98.5%",
      numericValue: 98.5,
      suffix: "%",
      label: "Customer Satisfaction",
      color: "text-chart-3",
      bgGradient: "from-chart-3/20 to-chart-3/5",
    },
    {
      icon: Award,
      value: "40%",
      numericValue: 40,
      suffix: "%",
      label: "Average Savings",
      color: "text-accent",
      bgGradient: "from-accent/20 to-accent/5",
    },
  ], [totalUsers])

  return (
    <section className="py-16 border-b border-border bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="container relative mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="relative flex flex-col items-center text-center space-y-3 group">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`}
              />

              <div
                className={`relative p-4 rounded-xl bg-background border border-border shadow-sm group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ${stat.color}`}
              >
                <stat.icon className="h-8 w-8" />
              </div>
              <div className="relative">
                {stat.numericValue !== undefined ? (
                  <AnimatedCounter end={stat.numericValue} suffix={stat.suffix || "+"} />
                ) : (
                  <div className="text-3xl font-bold">{stat.value}</div>
                )}
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Smartphone, Download, Zap } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { AuthModal } from "@/components/auth-modal"
import { useSocketIO } from "@/hooks/use-socketio"
import type { SocketIOMessage } from "@/hooks/use-socketio"

export function CTASection() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("signup")
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
      // Fallback to default value if fetch fails
      setTotalUsers(50000)
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

  return (
    <section className="py-24 bg-gradient-to-br from-primary via-primary/95 to-primary/90 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl animate-pulse-glow" />
        <div
          className="absolute bottom-10 left-10 h-80 w-80 rounded-full bg-accent/10 blur-3xl animate-pulse-glow"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="container relative mx-auto max-w-7xl px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex p-4 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm">
              <Smartphone className="h-12 w-12 text-primary-foreground" />
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl md:text-5xl text-balance">
              {"Ready to Experience Hassle-Free Travel?"}
            </h2>

            <p className="text-lg text-primary-foreground/90 max-w-2xl text-pretty leading-relaxed">
              {
                "Join thousands of smart travelers who save time and money with Damaria's Travel. Get started in seconds—credit card required."
              }
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                asChild
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-2xl shadow-accent/30 group"
              >
                <Link href="/auth/signup">
                  {"Create Free Account"}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 backdrop-blur-sm"
              >
                <Link href="/search">{"Browse Routes"}</Link>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" />
                  <span className="text-2xl font-bold text-primary-foreground">2min</span>
                </div>
                <p className="text-xs text-primary-foreground/70">Average booking time</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-accent" />
                  <span className="text-2xl font-bold text-primary-foreground">
                    {totalUsers !== null 
                      ? totalUsers >= 1000 
                        ? `${(totalUsers / 1000).toFixed(0)}K+`
                        : `${totalUsers}+`
                      : "50K+"}
                  </span>
                </div>
                <p className="text-xs text-primary-foreground/70">Happy travelers</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary-foreground">4.9</span>
                  <span className="text-accent">{"⭐"}</span>
                </div>
                <p className="text-xs text-primary-foreground/70">User rating</p>
              </div>
            </div>

            {/* <p className="text-sm text-primary-foreground/70">
              {"💳 No credit card required • 🎉 40% off first booking • ⚡ Instant setup"}
            </p> */}
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/30 to-primary-foreground/20 rounded-3xl blur-3xl" />
            <div className="relative">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-primary-foreground/20 shadow-2xl backdrop-blur-sm bg-primary-foreground/5">
                <div className="p-6 space-y-6">
                  <div className="bg-primary-foreground/90 rounded-xl p-4 shadow-lg">
                    <div className="h-3 w-20 bg-accent rounded mb-3" />
                    <div className="h-2 w-32 bg-primary/20 rounded mb-2" />
                    <div className="h-2 w-24 bg-primary/20 rounded" />
                  </div>
                  <div className="bg-primary-foreground/90 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-accent" />
                      <div className="flex-1">
                        <div className="h-2 w-20 bg-primary/20 rounded mb-2" />
                        <div className="h-2 w-16 bg-primary/20 rounded" />
                      </div>
                    </div>
                    <div className="h-px bg-primary/10 my-3" />
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-primary/20 rounded" />
                      <div className="h-2 w-3/4 bg-primary/20 rounded" />
                    </div>
                  </div>
                  <div className="bg-primary-foreground/90 rounded-xl p-4 shadow-lg">
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className={`h-8 rounded ${i === 5 ? "bg-accent" : "bg-primary/10"}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} defaultTab={authModalTab} />
    </section>
  )
}

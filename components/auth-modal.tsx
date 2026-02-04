"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Lock, User as UserIcon, Sparkles, Eye, EyeOff, Phone, CheckCircle2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/auth-context"
import type { User } from "@/lib/auth"
import { toast } from "sonner"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: "login" | "signup"
}

export function AuthModal({ open, onOpenChange, defaultTab = "login" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [showPassword, setShowPassword] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [firstTimePromotion, setFirstTimePromotion] = useState<{
    id: number
    discountType: string
    discountValue: number
    maxDiscount?: number
    description: string
  } | null>(null)
  const { login, refreshUser } = useAuth()
  const router = useRouter()

  // Update active tab when defaultTab changes
  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  useEffect(() => {
    if (open) {
      // Set the active tab when modal opens
      setActiveTab(defaultTab)
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 300)
      
      // Fetch active first-time user promotion
      const fetchFirstTimePromotion = async () => {
        try {
          const response = await fetch("/api/promo-codes/student")
          if (response.ok) {
            const data = await response.json()
            setFirstTimePromotion(data.promotion)
          }
        } catch (error) {
          console.error("Failed to fetch first-time promotion:", error)
          setFirstTimePromotion(null)
        }
      }
      
      fetchFirstTimePromotion()
      
      return () => clearTimeout(timer)
    }
  }, [open, defaultTab])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] h-[600px] p-0 border-none gap-0 flex flex-col overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 pointer-events-none">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-accent/30 blur-3xl animate-pulse-glow" />
          <div
            className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-primary/30 blur-3xl animate-pulse-glow"
            style={{ animationDelay: "1s" }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="relative bg-gradient-to-r from-primary to-accent p-6 text-primary-foreground flex-shrink-0 z-10">
          <div className="flex items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Damaria's Travel</h2>
              <p className="text-xs text-primary-foreground/80">Your Journey Starts Here</p>
            </div>
          </div>
        </div>

        <div className="relative p-6 sm:p-8 flex-1 min-h-0 overflow-y-auto z-10">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-12 sticky top-0 z-20 bg-background">
              <TabsTrigger value="login" className="text-base font-semibold">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-base font-semibold">
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-5 mt-0">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center mb-1">Welcome Back!</DialogTitle>
                <p className="text-center text-muted-foreground text-sm">
                  Sign in to access your bookings and exclusive deals
                </p>
              </DialogHeader>

              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault()
                  setIsLoading(true)
                  setError(null)

                  const formData = new FormData(e.currentTarget)
                  const email = formData.get("login-email") as string
                  const password = formData.get("login-password") as string

                  try {
                    const response = await fetch("/api/auth/login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email, password }),
                    })

                    if (!response.ok) {
                      const data = await response.json()
                      const errorMsg = data.error || "Login failed"
                      setError(errorMsg)
                      toast.error(errorMsg)
                      setIsLoading(false)
                      return
                    }

                    const data = await response.json()

                    // Update auth context immediately
                    login(data.user)
                    
                    // Close modal
                    onOpenChange(false)

                    // Check if user is admin and redirect accordingly
                    if (data.user.isAdmin) {
                      toast.success("Welcome back, Admin!")
                      // Use client navigation for instant redirect (keeps AuthProvider state)
                      router.replace("/admin")
                      return
                    } else {
                      toast.success("Welcome back! You're now logged in.")
                      // Refresh in background to ensure server/client are in sync
                      void refreshUser()
                      // Clear URL parameters after successful login
                      const url = new URL(window.location.href)
                      if (url.searchParams.has("auth") || url.searchParams.has("admin")) {
                        url.searchParams.delete("auth")
                        url.searchParams.delete("admin")
                        window.history.replaceState({}, "", url.toString())
                      }
                    }
                  } catch (err) {
                    const errorMsg = "An error occurred. Please try again."
                    setError(errorMsg)
                    toast.error(errorMsg)
                    console.error("Login error:", err)
                  } finally {
                    setIsLoading(false)
                  }
                }}
              >
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-semibold">
                    Email Address
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="login-email"
                      name="login-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 h-12 border-2 focus:border-primary transition-all"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-semibold">
                    Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="login-password"
                      name="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 h-12 border-2 focus:border-primary transition-all"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" />
                    <label htmlFor="remember" className="cursor-pointer">
                      Remember me
                    </label>
                  </div>
                </div> */}

                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup" className="space-y-5 mt-0">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center mb-1">Create Your Account</DialogTitle>
                <p className="text-center text-muted-foreground text-sm">Join 50,000+ happy travelers today</p>
              </DialogHeader>

              {/* First-time user promotion commented out */}
              {/* {firstTimePromotion && (
                <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 transition-all hover:border-primary/50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span className="text-sm font-semibold">Special Offer for New Users!</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs text-muted-foreground">{firstTimePromotion.description}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )} */}

              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault()
                  setIsLoading(true)
                  setError(null)

                  const formData = new FormData(e.currentTarget)
                  const fullName = formData.get("signup-name") as string
                  const email = formData.get("signup-email") as string
                  const password = formData.get("signup-password") as string
                  const phone = formData.get("signup-phone") as string

                  // Parse full name
                  const nameParts = fullName.trim().split(" ")
                  const firstName = nameParts[0] || ""
                  const lastName = nameParts.slice(1).join(" ") || ""

                  if (!firstName) {
                    setError("Please enter your full name")
                    setIsLoading(false)
                    return
                  }

                  try {
                    const response = await fetch("/api/auth/signup", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email,
                        password,
                        firstName,
                        lastName,
                        phone: phone || undefined,
                        promotionId: firstTimePromotion ? firstTimePromotion.id : undefined,
                      }),
                    })

                    if (!response.ok) {
                      const data = await response.json()
                      const errorMsg = data.error || "Signup failed"
                      setError(errorMsg)
                      toast.error(errorMsg)
                      setIsLoading(false)
                      return
                    }

                    const data = await response.json()

                    // Update auth context
                    login(data.user)
                    await refreshUser()

                    // Show success toast with verification message
                    toast.success(data.message || "Account created successfully! Please check your email to verify your account.")

                    // Close modal
                    onOpenChange(false)
                  } catch (err) {
                    const errorMsg = "An error occurred. Please try again."
                    setError(errorMsg)
                    toast.error(errorMsg)
                    console.error("Signup error:", err)
                  } finally {
                    setIsLoading(false)
                  }
                }}
              >
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-semibold">
                    Full Name
                  </Label>
                  <div className="relative group">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="signup-name"
                      name="signup-name"
                      placeholder="John Doe"
                      className="pl-10 h-12 border-2 focus:border-primary transition-all"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-semibold">
                    Email Address
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="signup-email"
                      name="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 h-12 border-2 focus:border-primary transition-all"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone" className="text-sm font-semibold">
                    Phone Number
                  </Label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="signup-phone"
                      name="signup-phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="pl-10 h-12 border-2 focus:border-primary transition-all"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-semibold">
                    Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="signup-password"
                      name="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      className="pl-10 pr-10 h-12 border-2 focus:border-primary transition-all"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" required className="mt-0.5" />
                  <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                    I agree to the{" "}
                    <Button variant="link" className="h-auto p-0 text-xs text-primary font-medium">
                      Terms of Service
                    </Button>{" "}
                    and{" "}
                    <Button variant="link" className="h-auto p-0 text-xs text-primary font-medium">
                      Privacy Policy
                    </Button>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

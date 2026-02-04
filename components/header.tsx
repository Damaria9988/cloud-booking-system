"use client"

import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { UserMenu } from "@/components/user-menu"
import { AuthModal } from "@/components/auth-modal"
import { useAuth } from "@/contexts/auth-context"
import { useSearchParams, usePathname, useRouter } from "next/navigation"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("login")
  const { isAuthenticated } = useAuth()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  // Auto-open auth modal if auth=required in URL
  useEffect(() => {
    if (searchParams.get("auth") === "required" && !isAuthenticated) {
      setAuthModalOpen(true)
      setAuthModalTab("login")
    }
  }, [searchParams, isAuthenticated])

  // Handle opening auth modal - navigate to home first if not already there
  const handleOpenAuthModal = (tab: "login" | "signup") => {
    // If not on home page, navigate to home first with auth modal flag
    if (pathname !== "/") {
      router.push(`/?openAuth=${tab}`)
    } else {
      setAuthModalTab(tab)
      setAuthModalOpen(true)
    }
  }

  // Check URL for openAuth parameter (after redirect from other pages)
  useEffect(() => {
    const openAuth = searchParams.get("openAuth")
    if (openAuth === "login" || openAuth === "signup") {
      setAuthModalTab(openAuth)
      setAuthModalOpen(true)
      // Clean up URL without reloading
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        url.searchParams.delete("openAuth")
        window.history.replaceState({}, "", url.toString())
      }
    }
  }, [searchParams])

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" prefetch={true} className="flex items-center gap-2 font-bold text-xl">
            <img 
              src="/logo-light.png" 
              alt="Damaria's Travel" 
              className="h-50 w-auto dark:hidden"
            />
            <img 
              src="/logo-dark.png" 
              alt="Damaria's Travel" 
              className="h-50 w-auto hidden dark:block"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            <Link
              href="/"
              prefetch={true}
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              href="#features"
              prefetch={false}
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              prefetch={false}
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
            {/* <Link
              href="#discounts"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Discounts
            </Link> */}


            {isAuthenticated && (
              <Link
                href="/bookings"
                prefetch={true}
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                My Bookings
              </Link>
            )}
          </div>

          <div className="hidden md:flex md:items-center md:gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <UserMenu />
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => handleOpenAuthModal("login")}
                >
                  Sign In
                </Button>
                <Button
                  className="bg-accent hover:bg-accent/90"
                  onClick={() => handleOpenAuthModal("signup")}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button and User Menu */}
          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated && (
              <div className="flex items-center">
                <UserMenu />
              </div>
            )}
            <button className="p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur">
            <div className="container mx-auto max-w-7xl px-4 py-4 space-y-3">
              <Link
                href="/"
                className="block py-2 text-sm font-medium text-foreground/80 hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="#features"
                className="block py-2 text-sm font-medium text-foreground/80 hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="block py-2 text-sm font-medium text-foreground/80 hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              {/* <Link
                href="#discounts"
                className="block py-2 text-sm font-medium text-foreground/80 hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Discounts
              </Link> */}
              {isAuthenticated && (
                <Link
                  href="/bookings"
                  className="block py-2 text-sm font-medium text-foreground/80 hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Bookings
                </Link>
              )}
              {!isAuthenticated && (
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleOpenAuthModal("login")
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    className="bg-accent hover:bg-accent/90"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleOpenAuthModal("signup")
                    }}
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} defaultTab={authModalTab} />
    </>
  )
}

"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Route, Ticket, Users, Settings, Tag, BarChart3, Plane, LogOut, Calendar, Building2, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  // Track navigation state
  useEffect(() => {
    // Reset navigating state when pathname changes (navigation completed)
    if (navigatingTo && pathname === navigatingTo) {
      setNavigatingTo(null)
    }
  }, [pathname, navigatingTo])

  const handleNavClick = (href: string) => {
    if (href !== pathname) {
      setNavigatingTo(href)
    }
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Operators",
      href: "/admin/operators",
      icon: Building2,
    },
    {
      title: "Routes",
      href: "/admin/routes",
      icon: Route,
    },
    {
      title: "Schedules",
      href: "/admin/schedules",
      icon: Calendar,
    },
    {
      title: "Bookings",
      href: "/admin/bookings",
      icon: Ticket,
    },
    {
      title: "Customers",
      href: "/admin/customers",
      icon: Users,
    },
    // Promotions tab commented out
    // {
    //   title: "Promotions",
    //   href: "/admin/promotions",
    //   icon: Tag,
    // },
    {
      title: "Reports",
      href: "/admin/reports",
      icon: BarChart3,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ]

  return (
    <div className="w-64 border-r border-border bg-background flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Plane className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Damaria's Travel</span>
        </Link>
        <p className="text-xs text-muted-foreground mt-2">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const isNavigating = navigatingTo === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={() => handleNavClick(item.href)}
              onMouseEnter={() => {
                // Aggressively prefetch on hover for instant navigation (only if router is ready)
                if (typeof window !== 'undefined' && router) {
                  try {
                    router.prefetch(item.href)
                  } catch (err) {
                    // Silently handle prefetch errors
                  }
                }
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isNavigating && "opacity-70"
              )}
            >
              <item.icon className={cn("h-5 w-5", isNavigating && "animate-pulse")} />
              <span className="flex-1">{item.title}</span>
              {isNavigating && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
          <Link href="/" prefetch={true}>
            <Plane className="mr-2 h-4 w-4" />
            Back to Site
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}

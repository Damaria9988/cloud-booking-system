"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Loader2 } from "lucide-react"

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  useEffect(() => {
    // Only redirect if we're done loading and user is NOT admin
    if (!loading) {
      if (!isAuthenticated || !user?.isAdmin) {
        router.push("/?auth=required&admin=true")
      } else {
        setInitialCheckDone(true)
      }
    }
  }, [user, isAuthenticated, loading, router])

  // Show loading spinner ONLY on initial auth check, not on navigation
  if (loading && !initialCheckDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If auth check failed and we're redirecting
  if (!loading && (!isAuthenticated || !user?.isAdmin)) {
    return null // Don't show anything while redirecting
  }

  // User is authenticated and is admin, render children immediately
  return <>{children}</>
}

// Loading fallback for page transitions
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  const [prevPathname, setPrevPathname] = useState(pathname)

  useEffect(() => {
    // If pathname changed, we're navigating
    if (pathname !== prevPathname) {
      setPrevPathname(pathname)
      
      // Only show overlay if navigation takes longer than 500ms
      const timer = setTimeout(() => {
        setIsNavigating(true)
      }, 500)

      return () => {
        clearTimeout(timer)
        setIsNavigating(false)
      }
    }
  }, [pathname, prevPathname])

  return (
    <AdminAuthGuard>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
      {isNavigating && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-4 bg-background/95 backdrop-blur-md rounded-lg p-8 shadow-lg border">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading page...</p>
          </div>
        </div>
      )}
    </AdminAuthGuard>
  )
}

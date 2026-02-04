"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/10 via-background to-primary/10 p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-destructive/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <div className="max-w-2xl mx-auto text-center space-y-8 relative z-10">
        {/* Error Icon */}
        <div className="mx-auto w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
          <AlertTriangle className="w-12 h-12 text-destructive" />
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-balance">Something Went Wrong</h2>
          <p className="text-xl text-muted-foreground text-pretty max-w-md mx-auto">
            We encountered an unexpected error while processing your request. Don't worry, we're on it!
          </p>
        </div>

        {/* Error Details (if available) */}
        {error.digest && (
          <div className="bg-muted/50 border rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-muted-foreground">
              Error ID: <span className="font-mono">{error.digest}</span>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button onClick={reset} size="lg" className="gap-2 min-w-[200px]">
            <RefreshCw className="w-5 h-5" />
            Try Again
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 min-w-[200px] bg-transparent">
            <Link href="/">
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Tips */}
        <div className="pt-8 border-t">
          <h3 className="font-semibold mb-3">What you can try:</h3>
          <ul className="text-sm text-muted-foreground space-y-2 max-w-md mx-auto text-left">
            <li>• Refresh the page and try again</li>
            <li>• Check your internet connection</li>
            <li>• Clear your browser cache</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

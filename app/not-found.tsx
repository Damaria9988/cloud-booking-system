import Link from "next/link"
import { Home, Search, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <div className="max-w-2xl mx-auto text-center space-y-8 relative z-10">
        {/* 404 Illustration */}
        <div className="relative flex items-center justify-center min-h-[300px] md:min-h-[400px]">
          {/* 404 Text - Background layer */}
          <h1 className="absolute text-[150px] md:text-[200px] font-bold text-primary/30 leading-none select-none pointer-events-none z-0">
            404
          </h1>
          {/* Image - Foreground layer */}
          <div className="relative z-10">
            <img src="/lost-ticket-illustration.jpg" alt="Lost Ticket" className="w-48 md:w-64 animate-float" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-balance">Oops! Page Not Found</h2>
          <p className="text-xl text-muted-foreground text-pretty max-w-md mx-auto">
            Looks like this ticket has gone missing. The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="gap-2 min-w-[200px]">
            <Link href="/" prefetch={true}>
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 min-w-[200px] bg-transparent">
            <Link href="/search" prefetch={true}>
              <Search className="w-5 h-5" />
              Search Tickets
            </Link>
          </Button>
        </div>

        {/* Help Section */}
        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Need help? We're here for you!</p>
          <Button asChild variant="ghost" className="gap-2">
            <Link href="/">
              <HelpCircle className="w-4 h-4" />
              Contact Support
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

import { Wrench, Clock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <div className="max-w-2xl mx-auto text-center space-y-8 relative z-10">
        {/* Maintenance Icon */}
        <div className="relative">
          <div className="mx-auto w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center animate-in zoom-in duration-500">
            <Wrench className="w-16 h-16 text-white animate-pulse" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-balance">Under Maintenance</h1>
          <p className="text-xl text-muted-foreground text-pretty max-w-md mx-auto">
            We're currently upgrading our systems to serve you better. We'll be back shortly!
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
          <Card>
            <CardContent className="p-6">
              <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="font-semibold mb-1">Estimated Time</p>
              <p className="text-2xl font-bold text-primary">2 Hours</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Mail className="w-8 h-8 text-accent mx-auto mb-3" />
              <p className="font-semibold mb-1">Stay Updated</p>
              <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                Notify Me
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Information */}
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-bold text-lg">What's happening?</h3>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li>• Upgrading cloud infrastructure for better performance</li>
              <li>• Implementing new security features</li>
              <li>• Enhancing real-time seat availability system</li>
              <li>• Optimizing payment processing</li>
            </ul>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent animate-pulse" style={{ width: "65%" }} />
          </div>
          <p className="text-sm text-muted-foreground mt-2">65% Complete</p>
        </div>

        <p className="text-sm text-muted-foreground">
          Thank you for your patience. Follow us on social media for real-time updates.
        </p>
      </div>
    </div>
  )
}

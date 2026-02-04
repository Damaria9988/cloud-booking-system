import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Shield, Wallet, Ticket, Globe, TrendingDown } from "lucide-react"
import Image from "next/image"

export function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast Booking",
      description:
        "Book your tickets in under 2 minutes with our streamlined, intuitive interface powered by cloud technology.",
      gradient: "from-chart-1/10 to-chart-1/5",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description:
        "Industry-leading security with encrypted transactions and QR-coded digital tickets for safe travel.",
      gradient: "from-chart-3/10 to-chart-3/5",
    },
    {
      icon: Wallet,
      title: "Transparent Pricing",
      description:
        "No hidden fees. What you see is what you pay. Plus, exclusive discounts for students and frequent travelers.",
      gradient: "from-accent/10 to-accent/5",
    },
    {
      icon: Ticket,
      title: "Real-Time Availability",
      description: "Live seat updates ensure you always know what's available. No more double bookings or surprises.",
      gradient: "from-chart-2/10 to-chart-2/5",
    },
    {
      icon: Globe,
      title: "Regional Coverage",
      description: "Book tickets for routes often ignored by big apps, including small towns and rural destinations.",
      gradient: "from-chart-4/10 to-chart-4/5",
    },
    {
      icon: TrendingDown,
      title: "Best Prices Guaranteed",
      description: "Compare prices across operators and get the best deals with our intelligent pricing algorithm.",
      gradient: "from-chart-5/10 to-chart-5/5",
    },
  ]

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
            {"Why Choose Damaria's Travel?"}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            {"Experience the future of ticket booking with features designed for modern travelers"}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary border border-primary/20">
              <Zap className="h-4 w-4" />
              <span>Smart Technology</span>
            </div>
            <h3 className="text-3xl font-bold">Book Tickets in Seconds</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Our intelligent booking system uses cutting-edge cloud technology to provide real-time updates, instant
              confirmations, and seamless payment processing. Experience booking that's faster than ever before.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="font-medium">Instant Seat Selection</p>
                  <p className="text-sm text-muted-foreground">Choose your preferred seat with live availability</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="font-medium">Smart Price Comparison</p>
                  <p className="text-sm text-muted-foreground">AI-powered algorithm finds the best deals</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="font-medium">QR Code Tickets</p>
                  <p className="text-sm text-muted-foreground">Digital tickets ready in your device instantly</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-border shadow-2xl">
              <Image
                src="/modern-travel-booking-app-interface-on-laptop-and-.jpg"
                alt="Modern booking interface"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-300 border-border hover:border-accent/50 overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />
              <CardHeader className="relative">
                <div className="mb-4 inline-flex p-3 rounded-xl bg-primary/10 text-primary w-fit">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

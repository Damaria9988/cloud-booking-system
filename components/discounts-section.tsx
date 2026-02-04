import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GraduationCap, Repeat, Gift, Sparkles, Snowflake } from "lucide-react"

export function DiscountsSection() {
  const discounts = [
    {
      icon: GraduationCap,
      badge: "Most Popular",
      title: "Student Discount",
      discount: "30%",
      description: "Verify your student status once and enjoy 30% off on all bookings throughout the year.",
      features: ["Valid student ID required", "Unlimited bookings", "All routes included"],
      color: "text-chart-1",
      bgColor: "bg-chart-1/5",
      badgeColor: "bg-chart-1",
    },
    {
      icon: Repeat,
      badge: "Best Value",
      title: "Frequent Traveler",
      discount: "25%",
      description: "Travel often? Get rewarded! Enjoy 25% off after your 5th booking each month.",
      features: ["Automatic activation", "Stacks with other offers", "Priority support"],
      color: "text-accent",
      bgColor: "bg-accent/5",
      badgeColor: "bg-accent",
    },
    // First-time user discount commented out
    // {
    //   icon: Gift,
    //   badge: "Limited Time",
    //   title: "First-Time User",
    //   discount: "40%",
    //   description: "New to Damaria's Travel? Welcome aboard! Get 40% off your first booking with code WELCOME40.",
    //   features: ["One-time use", "All transport modes", "No minimum booking"],
    //   color: "text-chart-3",
    //   bgColor: "bg-chart-3/5",
    //   badgeColor: "bg-chart-3",
    // },
  ]

  return (
    <section id="discounts" className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container relative mx-auto max-w-7xl px-4">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent border border-accent/20">
            <Sparkles className="h-4 w-4" />
            <span>{"Exclusive Offers"}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
            {"Save More on Every Journey"}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            {"Affordable travel for everyone—because you deserve the best prices"}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {discounts.map((discount, index) => (
            <Card
              key={index}
              className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-accent/50 overflow-hidden relative"
            >
              {/* Hover gradient effect */}
              <div
                className={`absolute inset-0 ${discount.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              <CardHeader className="relative pb-0">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${discount.bgColor} ${discount.color}`}>
                    <discount.icon className="h-6 w-6" />
                  </div>
                  <Badge className={`${discount.badgeColor} text-white border-0`}>{discount.badge}</Badge>
                </div>

                <div className="space-y-2">
                  <CardTitle className="text-2xl">{discount.title}</CardTitle>
                  <div className={`text-5xl font-bold ${discount.color}`}>
                    {discount.discount}
                    <span className="text-2xl ml-1">OFF</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-6 pt-6">
                <CardDescription className="text-base leading-relaxed">{discount.description}</CardDescription>

                <ul className="space-y-2">
                  {discount.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <div className={`h-1.5 w-1.5 rounded-full ${discount.color.replace("text-", "bg-")}`} />
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button className="w-full bg-primary hover:bg-primary/90">{"Claim Discount"}</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

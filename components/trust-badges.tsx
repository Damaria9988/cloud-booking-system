import { Shield, Award, Zap, Heart, Lock, TrendingUp } from "lucide-react"

export function TrustBadges() {
  const badges = [
    { icon: Shield, label: "Bank-Grade Security" },
    { icon: Award, label: "ISO Certified" },
    { icon: Zap, label: "99.9% Uptime" },
    { icon: Heart, label: "24/7 Support" },
    { icon: Lock, label: "Encrypted Payments" },
    { icon: TrendingUp, label: "Trusted by 50K+" },
  ]

  return (
    <section className="py-12 bg-muted/50 border-y border-border">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <badge.icon className="h-5 w-5" />
              <span className="text-sm font-medium whitespace-nowrap">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

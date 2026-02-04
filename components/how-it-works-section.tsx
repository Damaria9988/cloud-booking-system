"use client"

import { UserPlus, Search, CreditCard, Ticket } from "lucide-react"
import { useState } from "react"

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      icon: UserPlus,
      number: "01",
      title: "Create Account",
      description:
        "Sign up in seconds with email or social login. Students get instant verification for exclusive discounts.",
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      icon: Search,
      number: "02",
      title: "Search Routes",
      description:
        "Enter your origin, destination, and date. Our system shows real-time availability across all operators.",
      color: "text-accent",
      bgColor: "bg-accent/10",
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      icon: CreditCard,
      number: "03",
      title: "Select & Pay",
      description: "Choose your preferred seat, apply discounts, and complete secure payment. Zero hidden charges.",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      image: "/placeholder.svg?height=300&width=400",
    },
    {
      icon: Ticket,
      number: "04",
      title: "Get Ticket",
      description: "Receive your digital ticket instantly with unique PNR and QR code. Ready to travel!",
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      image: "/placeholder.svg?height=300&width=400",
    },
  ]

  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">{"How It Works"}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            {"Book your tickets in four simple steps—it's that easy"}
          </p>
        </div>

        <div className="hidden lg:grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-6">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              return (
                <div
                  key={index}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                    activeStep === index
                      ? `${step.bgColor} border-${step.color.replace("text-", "")}`
                      : "border-transparent hover:border-border"
                  }`}
                  onClick={() => setActiveStep(index)}
                  onMouseEnter={() => setActiveStep(index)}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className={`p-3 rounded-xl ${step.bgColor} border border-border`}>
                        <StepIcon className={`h-6 w-6 ${step.color}`} />
                      </div>
                      <div
                        className={`absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full ${step.color.replace("text-", "bg-")} text-white font-bold text-xs`}
                      >
                        {step.number}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl blur-2xl" />
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-border shadow-2xl bg-muted">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`text-6xl font-bold ${steps[activeStep].color} opacity-10`}>
                  {steps[activeStep].number}
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`p-8 rounded-2xl ${steps[activeStep].bgColor}`}>
                  {(() => {
                    const ActiveIcon = steps[activeStep].icon
                    return <ActiveIcon className={`h-24 w-24 ${steps[activeStep].color}`} />
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:hidden">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            return (
              <div key={index} className="relative flex flex-col items-center text-center">
                {/* Connection line (hidden on mobile, shown on larger screens after first item) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-14 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}

                {/* Step number badge */}
                <div className="relative mb-4">
                  <div className={`absolute inset-0 ${step.bgColor} blur-xl opacity-50`} />
                  <div
                    className={`relative flex h-28 w-28 items-center justify-center rounded-2xl ${step.bgColor} border border-border shadow-lg`}
                  >
                    <StepIcon className={`h-12 w-12 ${step.color}`} />
                  </div>
                  <div
                    className={`absolute -top-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full ${step.color.replace("text-", "bg-")} text-white font-bold text-sm shadow-lg`}
                  >
                    {step.number}
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Student, Delhi University",
    image: "/placeholder.svg?height=80&width=80",
    rating: 5,
    text: "As a student, the 30% discount is a lifesaver! I travel home every month and Damaria's Travel makes it so affordable. The QR tickets are super convenient.",
  },
  {
    name: "Rajesh Kumar",
    role: "Business Traveler",
    image: "/placeholder.svg?height=80&width=80",
    rating: 5,
    text: "I book tickets for my team regularly. The bulk booking feature and transparent pricing save us so much time and money. Highly recommended!",
  },
  {
    name: "Ananya Patel",
    role: "Freelance Designer",
    image: "/placeholder.svg?height=80&width=80",
    rating: 5,
    text: "The interface is so beautiful and easy to use! I can book tickets in under a minute. The real-time seat selection is a game changer.",
  },
  {
    name: "Mohammed Ali",
    role: "Rural Area Resident",
    image: "/placeholder.svg?height=80&width=80",
    rating: 5,
    text: "Finally, an app that covers routes to small towns! Other platforms ignore us, but Damaria's Travel connects me to the nearest city easily.",
  },
  {
    name: "Sneha Reddy",
    role: "Corporate Professional",
    image: "/placeholder.svg?height=80&width=80",
    rating: 5,
    text: "The frequent traveler discount is amazing! After my 5th booking, I get 25% off. Plus, customer support is always responsive.",
  },
  {
    name: "Arjun Singh",
    role: "Adventure Enthusiast",
    image: "/placeholder.svg?height=80&width=80",
    rating: 5,
    text: "I love exploring off-beat destinations. Damaria's Travel helps me find buses and trains to remote locations that other apps don't cover.",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent border border-accent/20">
            <Star className="h-4 w-4 fill-accent" />
            <span>Trusted by Thousands</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
            What Our Travelers Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Real stories from real people who love traveling with Damaria's Travel
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <Quote className="h-8 w-8 text-accent/20" />

                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>

                <p className="text-sm leading-relaxed text-foreground/90">{testimonial.text}</p>

                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

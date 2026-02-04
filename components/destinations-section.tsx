"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MapPin, Star } from "lucide-react"
import Image from "next/image"
import { useRef } from "react"

const destinations = [
  {
    id: 1,
    title: "Shimla's Best Kept Secret",
    image: "/himalayan-mountain-valley-with-snow-peaks.jpg",
    price: "₹1,299",
    rating: 4.8,
    location: "Himachal Pradesh",
  },
  {
    id: 2,
    title: "Tamil Nadu's Charming Hill Town",
    image: "/south-india-hill-station-with-clouds-and-tea-garde.jpg",
    price: "₹899",
    rating: 4.6,
    location: "Tamil Nadu",
  },
  {
    id: 3,
    title: "Picturesque Gateway to Himalayas",
    image: "/green-forest-road-leading-to-mountains.jpg",
    price: "₹1,499",
    rating: 4.9,
    location: "Uttarakhand",
  },
  {
    id: 4,
    title: "Quaint Little Hill Station in Gujarat",
    image: "/gujarat-hill-station-with-trees-and-clouds.jpg",
    price: "₹799",
    rating: 4.5,
    location: "Gujarat",
  },
  {
    id: 5,
    title: "A Pleasant Summer Retreat",
    image: "/blue-mountain-ranges-summer-landscape.jpg",
    price: "₹1,199",
    rating: 4.7,
    location: "Himachal Pradesh",
  },
  {
    id: 6,
    title: "Seaside Resort in West Bengal",
    image: "/bengal-seaside-beach-resort-sunset.jpg",
    price: "₹999",
    rating: 4.6,
    location: "West Bengal",
  },
]

const collections = [
  {
    id: 1,
    title: "Stays in & Around Delhi for a Weekend Getaway",
    badge: "TOP 8",
    image: "/delhi-resort-with-pool-and-mountains-at-sunset.jpg",
    count: "8 Places",
  },
  {
    id: 2,
    title: "Stays in & Around Mumbai for a Weekend Getaway",
    badge: "TOP 8",
    image: "/mumbai-luxury-resort-with-palm-trees-and-pool.jpg",
    count: "8 Places",
  },
  {
    id: 3,
    title: "Stays in & Around Bangalore for a Weekend Getaway",
    badge: "TOP 9",
    image: "/bangalore-resort-at-sunset-with-purple-sky.jpg",
    count: "9 Places",
  },
  {
    id: 4,
    title: "Beach Destinations",
    badge: "TOP 11",
    image: "/tropical-beach-with-clear-blue-water-and-palm-tree.jpg",
    count: "11 Places",
  },
  {
    id: 5,
    title: "Weekend Getaways",
    badge: "TOP 11",
    image: "/mountain-retreat-with-pine-trees-and-blue-sky.jpg",
    count: "11 Places",
  },
]

export function DestinationsSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const collectionsScrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right", ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const scrollAmount = 400
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Handpicked Collections */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold">Handpicked Collections for You</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("left", collectionsScrollRef)}
                className="rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("right", collectionsScrollRef)}
                className="rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div ref={collectionsScrollRef} className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            {collections.map((collection) => (
              <Card
                key={collection.id}
                className="group relative flex-shrink-0 w-[320px] sm:w-[380px] overflow-hidden cursor-pointer snap-start hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-[280px]">
                  <Image
                    src={collection.image || "/placeholder.svg"}
                    alt={collection.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="inline-block bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-foreground">
                      {collection.badge}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-2 text-balance">{collection.title}</h3>
                    <p className="text-sm text-white/90">{collection.count}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Lesser-Known Wonders */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold">Unlock Lesser-Known Wonders of India</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("left", scrollContainerRef)}
                className="rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll("right", scrollContainerRef)}
                className="rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div ref={scrollContainerRef} className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            {destinations.map((destination) => (
              <Card
                key={destination.id}
                className="group relative flex-shrink-0 w-[280px] sm:w-[320px] overflow-hidden cursor-pointer snap-start hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-[240px]">
                  <Image
                    src={destination.image || "/placeholder.svg"}
                    alt={destination.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-lg font-bold text-white mb-2 text-balance">{destination.title}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-white/90">
                        <MapPin className="h-3 w-3" />
                        <span className="text-sm">{destination.location}</span>
                      </div>
                      <div className="flex items-center gap-1 text-white">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{destination.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Starting from</span>
                    <span className="text-xl font-bold text-accent">{destination.price}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

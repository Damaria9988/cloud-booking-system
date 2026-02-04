"use client"

import { useEffect, useState } from "react"
import { ReviewCard } from "./review-card"
import { Button } from "@/components/ui/button"
import { Star, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Review {
  id: number
  rating: number
  title?: string
  comment: string
  isVerified: boolean
  helpfulCount: number
  createdAt: string
  user: {
    name: string
  }
}

interface ReviewsListProps {
  routeId?: number
  operatorId?: number
  limit?: number
}

export function ReviewsList({ routeId, operatorId, limit = 10 }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 })
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const { toast } = useToast()

  const fetchReviews = async (currentOffset = 0) => {
    try {
      if (currentOffset === 0) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString(),
      })

      if (routeId) params.append("routeId", routeId.toString())
      if (operatorId) params.append("operatorId", operatorId.toString())

      const response = await fetch(`/api/reviews?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch reviews")
      }

      if (currentOffset === 0) {
        setReviews(data.reviews)
      } else {
        setReviews((prev) => [...prev, ...data.reviews])
      }

      setStats(data.stats)
      setHasMore(data.pagination.hasMore)
      setOffset(currentOffset + limit)
    } catch (err) {
      console.error("Fetch reviews error:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load reviews",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    if (routeId || operatorId) {
      fetchReviews(0)
    }
  }, [routeId, operatorId])

  const loadMore = () => {
    fetchReviews(offset)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="flex items-center gap-6 p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
          <div>
            <div className="text-2xl font-bold">{stats.averageRating}</div>
            <div className="text-xs text-muted-foreground">out of 5</div>
          </div>
        </div>
        <div className="border-l pl-6">
          <div className="text-2xl font-bold">{stats.totalReviews}</div>
          <div className="text-xs text-muted-foreground">
            {stats.totalReviews === 1 ? "review" : "reviews"}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Reviews"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

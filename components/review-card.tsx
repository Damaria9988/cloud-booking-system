"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, ThumbsUp, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface ReviewCardProps {
  review: {
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
  onHelpful?: (reviewId: number) => void
}

export function ReviewCard({ review, onHelpful }: ReviewCardProps) {
  const [helpful, setHelpful] = useState(false)
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleHelpful = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/reviews/${review.id}/helpful`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to mark review as helpful")
      }

      setHelpful(data.helpful)
      setHelpfulCount((prev) => (data.helpful ? prev + 1 : prev - 1))

      toast({
        title: data.helpful ? "Marked as helpful!" : "Unmarked",
        description: data.message,
      })

      onHelpful?.(review.id)
    } catch (err) {
      console.error("Mark helpful error:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to mark review as helpful",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">{review.user.name}</span>
              {review.isVerified && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified Trip
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {review.title && (
          <h4 className="font-semibold mb-2">{review.title}</h4>
        )}
        <p className="text-muted-foreground mb-4">{review.comment}</p>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHelpful}
            disabled={loading}
            className={helpful ? "text-primary" : ""}
          >
            <ThumbsUp className={`h-4 w-4 mr-1 ${helpful ? "fill-current" : ""}`} />
            Helpful ({helpfulCount})
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

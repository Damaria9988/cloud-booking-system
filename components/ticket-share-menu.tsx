"use client"

import { useState, useEffect } from "react"
import { Share2, Copy, Mail, MessageCircle, Facebook, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface TicketShareMenuProps {
  ticketUrl: string
  ticketTitle: string
  ticketText?: string
}

export function TicketShareMenu({ ticketUrl, ticketTitle, ticketText }: TicketShareMenuProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [supportsWebShare, setSupportsWebShare] = useState(false)

  // Check if Web Share API is supported
  useEffect(() => {
    setSupportsWebShare(
      typeof navigator !== "undefined" && "share" in navigator
    )
  }, [])

  // Default share text
  const shareText = ticketText || `Check out my travel ticket: ${ticketTitle}`

  // Try Web Share API first, fallback to dropdown menu
  const handleShareClick = async (e: React.MouseEvent) => {
    // If Web Share API is available, try it first
    if (supportsWebShare) {
      e.preventDefault()
      e.stopPropagation()
      
      try {
        await navigator.share({
          title: ticketTitle,
          text: shareText,
          url: ticketUrl,
        })
        // Share was successful
        return
      } catch (error: any) {
        // User cancelled or error occurred
        // If user cancelled, don't show dropdown
        if (error.name === "AbortError") {
          return
        }
        // For other errors, show dropdown menu as fallback
        setIsOpen(true)
      }
    } else {
      // Web Share API not available, let dropdown open normally
      // Don't prevent default
    }
  }

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(ticketUrl)
      toast({
        title: "Link copied!",
        description: "Ticket link has been copied to your clipboard.",
      })
      setIsOpen(false)
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Share via Email
  const handleEmailShare = () => {
    const subject = encodeURIComponent(ticketTitle)
    const body = encodeURIComponent(`${shareText}\n\n${ticketUrl}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    setIsOpen(false)
  }

  // Share via WhatsApp
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${shareText} ${ticketUrl}`)
    window.open(`https://wa.me/?text=${text}`, "_blank")
    setIsOpen(false)
  }

  // Share via Facebook
  const handleFacebookShare = () => {
    const url = encodeURIComponent(ticketUrl)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank")
    setIsOpen(false)
  }

  // Share via Twitter/X
  const handleTwitterShare = () => {
    const text = encodeURIComponent(shareText)
    const url = encodeURIComponent(ticketUrl)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank")
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          onClick={handleShareClick}
          className="flex-1 sm:flex-initial bg-transparent"
          variant="outline"
          type="button"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyLink}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleEmailShare}>
          <Mail className="mr-2 h-4 w-4" />
          Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWhatsAppShare}>
          <MessageCircle className="mr-2 h-4 w-4" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFacebookShare}>
          <Facebook className="mr-2 h-4 w-4" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTwitterShare}>
          <Twitter className="mr-2 h-4 w-4" />
          Twitter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Custom hook for ticket actions (print, download, share)
 * Handles browser-specific print/download logic
 */

import { useState, useRef } from "react"

interface UseTicketActionsOptions {
  passengerName?: string
  onPrint?: () => void
  onDownload?: () => void
}

export function useTicketActions(options: UseTicketActionsOptions = {}) {
  const { passengerName, onPrint, onDownload } = options
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [printInstructions, setPrintInstructions] = useState("")
  const printDataRef = useRef<{ fileName: string; originalTitle: string } | null>(null)
  const shouldPrintRef = useRef(false)

  /**
   * Handle print action
   */
  const handlePrint = () => {
    // Set document title before printing for better PDF filename
    if (passengerName) {
      const originalTitle = document.title
      const fileName = `${passengerName} Ticket`
      document.title = fileName
      const titleTag = document.querySelector('title')
      if (titleTag) {
        titleTag.textContent = fileName
      }
      window.print()
      // Restore title after print dialog closes
      setTimeout(() => {
        document.title = originalTitle
        if (titleTag) {
          titleTag.textContent = originalTitle
        }
      }, 1000)
      return
    }
    
    if (onPrint) {
      onPrint()
    } else {
      window.print()
    }
  }

  /**
   * Handle PDF download action
   */
  const handleDownloadPDF = () => {
    // Set document title to use as PDF filename
    if (passengerName) {
      const fileName = `${passengerName} Ticket`
      const originalTitle = document.title
      
      // Use browser's native print-to-PDF feature
      const userAgent = navigator.userAgent.toLowerCase()
      const isChrome = userAgent.includes('chrome') && !userAgent.includes('edge')
      const isFirefox = userAgent.includes('firefox')
      const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome')
      const isEdge = userAgent.includes('edge')
      
      // Show helpful instructions based on browser
      let instructions = ''
      if (isChrome || isEdge) {
        instructions = `IMPORTANT: To remove "Ticket" and URL text from PDF:\n\n1. In the print dialog, click "More settings"\n2. UNCHECK "Headers and footers" (this removes unwanted text)\n3. Select "Save as PDF" or "Microsoft Print to PDF" as destination\n4. The filename will be "${fileName}.pdf"\n5. Click "Save" and choose location`
      } else if (isFirefox) {
        instructions = `IMPORTANT: To remove "Ticket" and URL text from PDF:\n\n1. In the print dialog, click "More Settings"\n2. UNCHECK "Print headers and footers" (this removes unwanted text)\n3. Select "Print to File" or "Save to PDF"\n4. The filename will be "${fileName}.pdf"\n5. Choose location and click "Save"`
      } else if (isSafari) {
        instructions = `To save as PDF on Mac:\n1. In the print dialog, click the PDF dropdown\n2. Select "Save as PDF"\n3. The filename will be "${fileName}.pdf"\n4. Choose location and click "Save"\n\nNote: In Safari, headers/footers are usually disabled by default.`
      } else {
        instructions = `IMPORTANT: To remove "Ticket" and URL text from PDF:\n\n1. In the print dialog, disable "Headers and footers" in settings\n2. Look for "Save as PDF" or "Print to File" option\n3. The filename will be "${fileName}.pdf"\n4. Select it and choose where to save\n5. Click Save`
      }
      
      // Show instructions dialog first
      setPrintInstructions(instructions)
      printDataRef.current = { fileName, originalTitle }
      shouldPrintRef.current = false
      setPrintDialogOpen(true)
    } else {
      if (onDownload) {
        onDownload()
      } else {
        window.print()
      }
    }
  }

  /**
   * Handle share action
   */
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: passengerName ? `${passengerName} Ticket` : 'Travel Ticket',
          text: 'Check out my travel ticket',
          url: window.location.href,
        })
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', error)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Ticket link copied to clipboard!')
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    }
  }

  /**
   * Handle email action
   */
  const handleEmail = () => {
    const subject = encodeURIComponent(passengerName ? `${passengerName} Ticket` : 'Travel Ticket')
    const body = encodeURIComponent(`Please find my travel ticket at: ${window.location.href}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  /**
   * Execute print after user confirms
   */
  const executePrint = () => {
    if (printDataRef.current) {
      const { fileName, originalTitle } = printDataRef.current
      document.title = fileName
      const titleTag = document.querySelector('title')
      if (titleTag) {
        titleTag.textContent = fileName
      }
      shouldPrintRef.current = true
      setPrintDialogOpen(false)
      
      // Trigger print
      setTimeout(() => {
        window.print()
        // Restore title after print
        setTimeout(() => {
          document.title = originalTitle
          if (titleTag) {
            titleTag.textContent = originalTitle
          }
        }, 1000)
      }, 100)
    }
  }

  return {
    handlePrint,
    handleDownloadPDF,
    handleShare,
    handleEmail,
    executePrint,
    printDialogOpen,
    setPrintDialogOpen,
    printInstructions,
    printDataRef,
    shouldPrintRef,
  }
}

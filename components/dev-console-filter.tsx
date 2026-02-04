'use client'

import { useEffect } from 'react'

/**
 * Suppress noisy WebSocket connection warnings in development
 * These warnings are harmless and occur due to Next.js hot reloading
 */
export function DevConsoleFilter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    const originalError = console.error
    const originalWarn = console.warn

    // Patterns to filter out (harmless WebSocket connection errors)
    const suppressedPatterns = [
      /Firefox can't establish a connection to the server at ws:\/\/localhost:3000\/api\/socket\.io/,
      /The connection to ws:\/\/localhost:3000\/api\/socket\.io.*was interrupted while the page was loading/,
      /WebSocket connection to 'ws:\/\/localhost:3000\/api\/socket\.io.*failed/,
      /Failed to load resource:.*socket\.io/,
      /can't establish a connection.*socket\.io/,
      /connection.*socket\.io.*interrupted/,
    ]

    // Filter console.error
    console.error = (...args: any[]) => {
      const message = args.join(' ')
      const shouldSuppress = suppressedPatterns.some(pattern => pattern.test(message))
      
      if (!shouldSuppress) {
        originalError.apply(console, args)
      }
    }

    // Filter console.warn
    console.warn = (...args: any[]) => {
      const message = args.join(' ')
      const shouldSuppress = suppressedPatterns.some(pattern => pattern.test(message))
      
      if (!shouldSuppress) {
        originalWarn.apply(console, args)
      }
    }

    // Also suppress unhandled WebSocket errors
    const errorHandler = (event: ErrorEvent) => {
      if (event.message && suppressedPatterns.some(pattern => pattern.test(event.message))) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener('error', errorHandler, true)

    // Cleanup on unmount
    return () => {
      console.error = originalError
      console.warn = originalWarn
      window.removeEventListener('error', errorHandler, true)
    }
  }, [])

  return null // This component doesn't render anything
}

import { useEffect, useRef, useCallback, useState } from "react"

interface UsePollingOptions {
  enabled?: boolean
  interval?: number
  refetchOnWindowFocus?: boolean
  refetchOnVisibilityChange?: boolean
  pauseWhenHidden?: boolean // NEW: Pause polling when tab is not visible
}

/**
 * Custom hook for polling data with automatic refetch
 * Now includes pauseWhenHidden to stop polling when tab is inactive
 * 
 * @param fetchFn - Function to fetch data
 * @param options - Polling options
 */
export function usePolling<T>(
  fetchFn: () => Promise<T> | void,
  options: UsePollingOptions = {}
) {
  const {
    enabled = true,
    interval = 5000, // 5 seconds default
    refetchOnWindowFocus = true,
    refetchOnVisibilityChange = true,
    pauseWhenHidden = true, // Default to pausing when hidden (saves resources)
  } = options

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const [isVisible, setIsVisible] = useState(() => 
    typeof document !== 'undefined' ? !document.hidden : true
  )

  // Track visibility state for pauseWhenHidden
  useEffect(() => {
    if (!pauseWhenHidden) {
      return
    }

    const handleVisibilityChange = () => {
      const visible = !document.hidden
      setIsVisible(visible)
      
      // When becoming visible again, immediately refetch if refetchOnVisibilityChange is true
      if (visible && refetchOnVisibilityChange && isMountedRef.current && enabled) {
        fetchFn()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pauseWhenHidden, refetchOnVisibilityChange, enabled])

  // Initial fetch on mount
  useEffect(() => {
    isMountedRef.current = true

    if (enabled) {
      fetchFn()
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  // Separate effect for interval management - responds to visibility changes
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Only set up interval if enabled, visible (or not pausing when hidden), and interval > 0
    const shouldPoll = enabled && interval > 0 && (isVisible || !pauseWhenHidden)
    
    if (shouldPoll) {
      intervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          fetchFn()
        }
      }, interval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, interval, isVisible, pauseWhenHidden])

  // Window focus handler (separate from visibility)
  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) {
      return
    }

    const handleFocus = () => {
      if (isMountedRef.current) {
        fetchFn()
      }
    }

    window.addEventListener("focus", handleFocus)
    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchOnWindowFocus, enabled])

  // Manual refresh function
  const refresh = useCallback(() => {
    if (isMountedRef.current && enabled) {
      fetchFn()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return { refresh, isVisible }
}

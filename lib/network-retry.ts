// Network retry utility with exponential backoff
// Enhances network error handling across the application

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryableStatuses?: number[]
  onRetry?: (attempt: number, error: Error) => void
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  onRetry: () => {},
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, options: Required<RetryOptions>): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true
  }

  // HTTP status codes
  if (error.status && options.retryableStatuses.includes(error.status)) {
    return true
  }

  // Timeout errors
  if (error.name === "AbortError" || error.message.includes("timeout")) {
    return true
  }

  return false
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = Math.min(
    options.initialDelay * Math.pow(options.backoffMultiplier, attempt),
    options.maxDelay
  )

  // Add jitter (±20%) to prevent thundering herd
  const jitter = delay * 0.2 * (Math.random() - 0.5)

  return Math.round(delay + jitter)
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts: Required<RetryOptions> = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Check if we should retry
      if (attempt === opts.maxRetries || !isRetryableError(error, opts)) {
        throw error
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts)
      opts.onRetry(attempt + 1, lastError)

      await sleep(delay)
    }
  }

  throw lastError!
}

/**
 * Enhanced fetch with retry logic
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, init)

    // Check if response status is retryable
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
      ;(error as any).status = response.status
      throw error
    }

    return response
  }, options)
}

/**
 * Fetch with timeout
 */
export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeout: number = 30000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Enhanced fetch with retry and timeout
 */
export async function fetchWithRetryAndTimeout(
  url: string,
  init?: RequestInit,
  options: RetryOptions & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30000, ...retryOptions } = options

  return retryWithBackoff(async () => {
    return await fetchWithTimeout(url, init, timeout)
  }, retryOptions)
}

/**
 * Check network connectivity
 */
export function isOnline(): boolean {
  if (typeof navigator !== "undefined") {
    return navigator.onLine
  }
  return true
}

/**
 * Wait for network to be available
 */
export async function waitForNetwork(timeout: number = 30000): Promise<boolean> {
  if (isOnline()) {
    return true
  }

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      window.removeEventListener("online", onOnline)
      resolve(false)
    }, timeout)

    const onOnline = () => {
      clearTimeout(timeoutId)
      window.removeEventListener("online", onOnline)
      resolve(true)
    }

    window.addEventListener("online", onOnline)
  })
}

/**
 * Network status monitor
 */
export class NetworkMonitor {
  private listeners: Set<(online: boolean) => void> = new Set()

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.notify(true))
      window.addEventListener("offline", () => this.notify(false))
    }
  }

  isOnline(): boolean {
    return isOnline()
  }

  onChange(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notify(online: boolean) {
    this.listeners.forEach((listener) => listener(online))
  }
}

/**
 * Create a singleton network monitor
 */
export const networkMonitor = new NetworkMonitor()

/**
 * React hook for network status
 */
export function useNetworkStatus() {
  if (typeof window === "undefined") {
    return { isOnline: true, isOffline: false }
  }

  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
  }
}

// Note: Add React import at the top if this file is used
declare const React: any

// API Response Caching Utility
// Implements in-memory cache with TTL (Time To Live)

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.startCleanup()
  }

  /**
   * Generate cache key from URL and params
   */
  private generateKey(url: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : ""
    return `${url}:${paramString}`
  }

  /**
   * Get cached data if not expired
   */
  get<T>(url: string, params?: Record<string, any>): T | null {
    const key = this.generateKey(url, params)
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    const now = Date.now()
    const age = now - entry.timestamp

    // Check if expired
    if (age > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set cache data with TTL
   */
  set<T>(url: string, data: T, ttl: number, params?: Record<string, any>): void {
    const key = this.generateKey(url, params)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(url: string, params?: Record<string, any>): void {
    const key = this.generateKey(url, params)
    this.cache.delete(key)
  }

  /**
   * Invalidate all cache entries matching pattern
   */
  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys())
    keys.forEach((key) => {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    })
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    entries: Array<{ key: string; age: number; ttl: number }>
  } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl,
    }))

    return {
      size: this.cache.size,
      entries,
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanup(): void {
    if (this.cleanupInterval) {
      return
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000) // 5 minutes
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keys = Array.from(this.cache.keys())

    keys.forEach((key) => {
      const entry = this.cache.get(key)
      if (entry && now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    })
  }
}

// Singleton instance
export const apiCache = new ApiCache()

/**
 * Cache TTL presets (in milliseconds)
 */
export const CacheTTL = {
  SHORT: 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
  HOUR: 60 * 60 * 1000, // 1 hour
  DAY: 24 * 60 * 60 * 1000, // 1 day
}

/**
 * Fetch with cache
 */
export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit & { ttl?: number; params?: Record<string, any> }
): Promise<T> {
  const { ttl = CacheTTL.MEDIUM, params, ...fetchOptions } = options || {}

  // Try to get from cache
  const cached = apiCache.get<T>(url, params)
  if (cached !== null) {
    return cached
  }

  // Fetch from API
  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data: T = await response.json()

  // Store in cache
  apiCache.set(url, data, ttl, params)

  return data
}

/**
 * Cache middleware for API routes
 */
export function withCache<T>(
  handler: () => Promise<T>,
  cacheKey: string,
  ttl: number = CacheTTL.MEDIUM
): Promise<T> {
  // Try to get from cache
  const cached = apiCache.get<T>(cacheKey)
  if (cached !== null) {
    return Promise.resolve(cached)
  }

  // Execute handler and cache result
  return handler().then((data) => {
    apiCache.set(cacheKey, data, ttl)
    return data
  })
}

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  // Invalidate all route-related caches
  routes() {
    apiCache.invalidatePattern("/api/routes")
  },

  // Invalidate all booking-related caches
  bookings(userId?: number) {
    if (userId) {
      apiCache.invalidatePattern(`/api/bookings:.*userId.*${userId}`)
    } else {
      apiCache.invalidatePattern("/api/bookings")
    }
  },

  // Invalidate all review-related caches
  reviews(routeId?: number) {
    if (routeId) {
      apiCache.invalidatePattern(`/api/reviews:.*routeId.*${routeId}`)
    } else {
      apiCache.invalidatePattern("/api/reviews")
    }
  },

  // Invalidate all schedule-related caches
  schedules() {
    apiCache.invalidatePattern("/api/schedules")
  },

  // Invalidate all operator-related caches
  operators() {
    apiCache.invalidatePattern("/api/operators")
  },

  // Invalidate all caches
  all() {
    apiCache.clear()
  },
}

/**
 * React hook for cached data fetching
 */
export function useCachedFetch<T>(
  url: string | null,
  options?: { ttl?: number; params?: Record<string, any> }
) {
  const [data, setData] = (React as any).useState(null) as [T | null, (value: T | null) => void]
  const [loading, setLoading] = (React as any).useState(true) as [boolean, (value: boolean) => void]
  const [error, setError] = (React as any).useState(null) as [Error | null, (value: Error | null) => void]

  (React as any).useEffect(() => {
    if (!url) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const result = await fetchWithCache<T>(url!, options)

        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [url, JSON.stringify(options?.params)])

  return { data, loading, error }
}

// Note: Add React import at the top if this file is used
declare const React: any

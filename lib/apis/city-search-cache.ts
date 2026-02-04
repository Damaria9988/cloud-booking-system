/**
 * City search API cache
 * Provides fast caching for city search results
 */

interface CacheEntry {
  results: any[]
  timestamp: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes
const MAX_CACHE_SIZE = 500 // Maximum cached queries

/**
 * Get cached results for a query
 */
export function getCachedResults(query: string): any[] | null {
  const cacheKey = query.toLowerCase().trim()
  const entry = cache.get(cacheKey)
  
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.results
  }
  
  // Remove expired entry
  if (entry) {
    cache.delete(cacheKey)
  }
  
  return null
}

/**
 * Cache search results
 */
export function cacheResults(query: string, results: any[]): void {
  const cacheKey = query.toLowerCase().trim()
  
  // Limit cache size - remove oldest entries
  if (cache.size >= MAX_CACHE_SIZE) {
    // Find and remove oldest entry
    let oldestKey: string | null = null
    let oldestTime = Date.now()
    
    for (const [key, entry] of cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      cache.delete(oldestKey)
    }
  }
  
  cache.set(cacheKey, {
    results,
    timestamp: Date.now()
  })
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    maxSize: MAX_CACHE_SIZE,
    duration: CACHE_DURATION
  }
}

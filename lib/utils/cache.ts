interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // in milliseconds
  hash?: string // For detecting data changes
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>()

  /**
   * Simple hash function for detecting data changes (browser-safe)
   */
  private hashData(data: any): string {
    try {
      const str = JSON.stringify(data)
      // Simple hash using string length + character sum
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash // Convert to 32bit integer
      }
      return Math.abs(hash).toString(16)
    } catch (err) {
      return Math.random().toString(36)
    }
  }

  /**
   * Get cached data if exists and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > entry.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set data in cache with TTL
   */
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      hash: this.hashData(data),
    })
  }

  /**
   * Get data hash (for detecting changes)
   */
  getHash(key: string): string | null {
    const entry = this.cache.get(key)
    return entry?.hash || null
  }

  /**
   * Check if data has changed by comparing hashes
   */
  hasDataChanged(key: string, newData: any): boolean {
    const oldHash = this.getHash(key)
    const newHash = this.hashData(newData)
    return oldHash !== newHash
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clear specific cache entry
   */
  remove(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Wrap an async function with automatic caching
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000,
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached) return cached

    const data = await fetchFn()
    this.set(key, data, ttlMs)
    return data
  }

  /**
   * Smart fetch - only load if data changed, else return cached
   * Returns { data, isNew } to indicate if data is fresh or cached
   */
  async smartFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000,
  ): Promise<{ data: T; isNew: boolean }> {
    const cached = this.get<T>(key)

    try {
      const newData = await fetchFn()

      // Check if data changed
      const dataChanged = this.hasDataChanged(key, newData)

      // Always update cache with new data
      this.set(key, newData, ttlMs)

      return {
        data: newData,
        isNew: dataChanged || !cached, // Show loading only if data changed or no cache
      }
    } catch (err) {
      // If fetch fails, return cached data without showing error
      if (cached) {
        return {
          data: cached,
          isNew: false, // Don't show loading if using stale cache
        }
      }
      throw err
    }
  }
}

// Singleton instance
export const apiCache = new RequestCache()

/**
 * Generate cache key from URL and optional params
 */
export function generateCacheKey(url: string, params?: Record<string, any>): string {
  if (!params) return url
  const queryString = new URLSearchParams(params).toString()
  return `${url}?${queryString}`
}

import { trackError } from './monitoring'

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  staleWhileRevalidate?: boolean // Whether to return stale data while fetching fresh data
}

class Cache {
  private cache: Map<string, { value: any; expires: number; lastAccessed: number }>
  private defaultTTL: number
  private maxSize: number
  private cleanupInterval: number
  private intervalId: number | null = null

  constructor(options: { 
    defaultTTL?: number; 
    maxSize?: number;
    cleanupInterval?: number;
  } = {}) {
    this.cache = new Map()
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000 // 5 minutes by default
    this.maxSize = options.maxSize || 100 // Maximum number of items in cache
    this.cleanupInterval = options.cleanupInterval || 60 * 1000 // 1 minute by default
    this.startCleanupInterval()
  }

  set(key: string, value: any, options: CacheOptions = {}) {
    try {
      const ttl = options.ttl || this.defaultTTL
      const expires = Date.now() + ttl
      
      // If cache is full, remove least recently used item
      if (this.cache.size >= this.maxSize) {
        this.removeLRU()
      }
      
      this.cache.set(key, { value, expires, lastAccessed: Date.now() })
      return true
    } catch (error) {
      trackError(error as Error, { context: 'cache.set', key })
      return false
    }
  }

  get<T>(key: string, options: CacheOptions = {}): T | null {
    try {
      const item = this.cache.get(key)
      if (!item) return null
      
      const now = Date.now()
      const isExpired = now > item.expires
      
      // Update last accessed time
      item.lastAccessed = now
      this.cache.set(key, item)
      
      if (!isExpired) {
        return item.value as T
      }
      
      // Handle stale-while-revalidate pattern
      if (options.staleWhileRevalidate) {
        return item.value as T
      }
      
      this.cache.delete(key)
      return null
    } catch (error) {
      trackError(error as Error, { context: 'cache.get', key })
      return null
    }
  }

  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cachedValue = this.get<T>(key, options)
      if (cachedValue !== null) {
        return cachedValue
      }
      
      // If not in cache or expired, fetch fresh data
      const freshValue = await fetchFn()
      this.set(key, freshValue, options)
      return freshValue
    } catch (error) {
      trackError(error as Error, { context: 'cache.getOrSet', key })
      throw error
    }
  }

  delete(key: string): boolean {
    try {
      return this.cache.delete(key)
    } catch (error) {
      trackError(error as Error, { context: 'cache.delete', key })
      return false
    }
  }

  clear(): void {
    try {
      this.cache.clear()
    } catch (error) {
      trackError(error as Error, { context: 'cache.clear' })
    }
  }

  // Clean up expired items
  cleanup(): void {
    try {
      const now = Date.now()
      for (const [key, item] of this.cache.entries()) {
        if (now > item.expires) {
          this.cache.delete(key)
        }
      }
    } catch (error) {
      trackError(error as Error, { context: 'cache.cleanup' })
    }
  }

  // Remove least recently used item
  private removeLRU(): void {
    try {
      let oldestKey: string | null = null
      let oldestAccess = Date.now()
      
      for (const [key, item] of this.cache.entries()) {
        if (item.lastAccessed < oldestAccess) {
          oldestAccess = item.lastAccessed
          oldestKey = key
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    } catch (error) {
      trackError(error as Error, { context: 'cache.removeLRU' })
    }
  }

  // Start automatic cleanup interval
  private startCleanupInterval(): void {
    if (this.intervalId !== null) {
      return
    }
    
    this.intervalId = setInterval(() => {
      this.cleanup()
    }, this.cleanupInterval) as unknown as number
  }

  // Stop automatic cleanup
  stopCleanupInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
}

export const cache = new Cache({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 200,
  cleanupInterval: 60 * 1000 // 1 minute
})
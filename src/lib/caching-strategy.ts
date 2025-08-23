/**
 * Multi-Layer Caching Strategy Implementation
 * Provides memory cache, browser storage, and IndexedDB caching layers
 */

import { trackError, trackPerformance } from '../../lib/monitoring'

// Caching configuration
const CACHE_CONFIG = {
  // Layer priorities: memory > sessionStorage > localStorage > indexedDB
  layers: {
    memory: {
      enabled: true,
      maxSize: 50, // Max number of entries
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxMemoryMB: 10 // Maximum memory usage in MB
    },
    sessionStorage: {
      enabled: true,
      maxSize: 100,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      keyPrefix: 'jobnexai_session_'
    },
    localStorage: {
      enabled: true,
      maxSize: 200,
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      keyPrefix: 'jobnexai_local_'
    },
    indexedDB: {
      enabled: true,
      dbName: 'JobNexAI_Cache',
      version: 1,
      storeName: 'cache_store',
      defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxSize: 1000
    }
  },
  compression: {
    enabled: true,
    threshold: 1024 // Compress if data is larger than 1KB
  },
  debug: import.meta.env.DEV
}

// Cache entry interface
interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
  size?: number
  compressed?: boolean
  accessCount?: number
  lastAccess?: number
}

// Cache statistics
interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  size: number
  memoryUsage: number
}

// Data compression utilities
class CompressionUtils {
  static compress(data: string): string {
    try {
      // Simple compression using JSON minification and base64
      const minified = JSON.stringify(JSON.parse(data))
      return btoa(unescape(encodeURIComponent(minified)))
    } catch {
      return data
    }
  }

  static decompress(data: string): string {
    try {
      return decodeURIComponent(escape(atob(data)))
    } catch {
      return data
    }
  }

  static shouldCompress(data: string): boolean {
    return CACHE_CONFIG.compression.enabled && data.length > CACHE_CONFIG.compression.threshold
  }
}

// Memory cache layer
class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map()
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0, memoryUsage: 0 }
  private accessOrder: string[] = []

  set(key: string, data: any, ttl: number = CACHE_CONFIG.layers.memory.defaultTTL): boolean {
    try {
      const serialized = JSON.stringify(data)
      const size = serialized.length
      
      // Check memory limits
      if (this.getMemoryUsage() + size > CACHE_CONFIG.layers.memory.maxMemoryMB * 1024 * 1024) {
        this.evictLRU()
      }

      // Remove from access order if already exists
      this.removeFromAccessOrder(key)

      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        ttl,
        size,
        accessCount: 0,
        lastAccess: Date.now()
      }

      this.cache.set(key, entry)
      this.accessOrder.push(key)
      this.stats.sets++
      this.updateStats()

      if (CACHE_CONFIG.debug) {
        console.log(`[MemoryCache] Set: ${key} (${this.cache.size}/${CACHE_CONFIG.layers.memory.maxSize})`)
      }

      return true
    } catch (error) {
      trackError(error as Error, { operation: 'memory_cache_set', key })
      return false
    }
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check expiration
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key)
      this.stats.misses++
      return null
    }

    // Update access statistics
    entry.accessCount = (entry.accessCount || 0) + 1
    entry.lastAccess = Date.now()
    
    // Update LRU order
    this.updateAccessOrder(key)
    
    this.stats.hits++

    if (CACHE_CONFIG.debug) {
      console.log(`[MemoryCache] Hit: ${key}`)
    }

    return entry.data
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.removeFromAccessOrder(key)
      this.stats.deletes++
      this.updateStats()
    }
    return deleted
  }

  clear(): void {
    this.cache.clear()
    this.accessOrder = []
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0, memoryUsage: 0 }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    return entry ? Date.now() - entry.timestamp <= entry.ttl : false
  }

  getStats(): CacheStats {
    return { ...this.stats }
  }

  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder[0]
      if (lruKey) {
        this.delete(lruKey)
        
        if (CACHE_CONFIG.debug) {
          console.log(`[MemoryCache] Evicted LRU: ${lruKey}`)
        }
      }
    }
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key)
    this.accessOrder.push(key)
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  private getMemoryUsage(): number {
    let total = 0
    for (const entry of this.cache.values()) {
      total += entry.size || 0
    }
    return total
  }

  private updateStats(): void {
    this.stats.size = this.cache.size
    this.stats.memoryUsage = this.getMemoryUsage()
  }
}

// Browser storage cache layer
class BrowserStorageCache {
  constructor(
    private storage: Storage,
    private config: typeof CACHE_CONFIG.layers.localStorage | typeof CACHE_CONFIG.layers.sessionStorage
  ) {}

  set(key: string, data: any, ttl: number = this.config.defaultTTL): boolean {
    try {
      const serialized = JSON.stringify(data)
      const shouldCompress = CompressionUtils.shouldCompress(serialized)
      
      const entry: CacheEntry = {
        data: shouldCompress ? CompressionUtils.compress(serialized) : data,
        timestamp: Date.now(),
        ttl,
        compressed: shouldCompress
      }

      const fullKey = this.config.keyPrefix + key
      this.storage.setItem(fullKey, JSON.stringify(entry))

      this.maintainSize()

      if (CACHE_CONFIG.debug) {
        console.log(`[BrowserStorage] Set: ${key} (compressed: ${shouldCompress})`)
      }

      return true
    } catch (error) {
      // Storage quota exceeded or other error
      trackError(error as Error, { operation: 'browser_storage_set', key })
      return false
    }
  }

  get(key: string): any | null {
    try {
      const fullKey = this.config.keyPrefix + key
      const item = this.storage.getItem(fullKey)
      
      if (!item) {
        return null
      }

      const entry: CacheEntry = JSON.parse(item)
      
      // Check expiration
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.delete(key)
        return null
      }

      if (CACHE_CONFIG.debug) {
        console.log(`[BrowserStorage] Hit: ${key}`)
      }

      return entry.compressed ? 
        JSON.parse(CompressionUtils.decompress(entry.data as string)) : 
        entry.data
    } catch (error) {
      trackError(error as Error, { operation: 'browser_storage_get', key })
      return null
    }
  }

  delete(key: string): boolean {
    try {
      const fullKey = this.config.keyPrefix + key
      this.storage.removeItem(fullKey)
      return true
    } catch (error) {
      trackError(error as Error, { operation: 'browser_storage_delete', key })
      return false
    }
  }

  clear(): void {
    try {
      const keysToRemove: string[] = []
      
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i)
        if (key && key.startsWith(this.config.keyPrefix)) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => this.storage.removeItem(key))
    } catch (error) {
      trackError(error as Error, { operation: 'browser_storage_clear' })
    }
  }

  has(key: string): boolean {
    const fullKey = this.config.keyPrefix + key
    return this.storage.getItem(fullKey) !== null
  }

  private maintainSize(): void {
    try {
      const keys = this.getOwnKeys()
      
      if (keys.length > this.config.maxSize) {
        // Remove oldest entries
        const entries = keys.map(key => {
          const item = this.storage.getItem(key)
          return {
            key,
            timestamp: item ? JSON.parse(item).timestamp : 0
          }
        }).sort((a, b) => a.timestamp - b.timestamp)

        const toRemove = entries.slice(0, keys.length - this.config.maxSize)
        toRemove.forEach(entry => this.storage.removeItem(entry.key))
      }
    } catch (error) {
      trackError(error as Error, { operation: 'browser_storage_maintain' })
    }
  }

  private getOwnKeys(): string[] {
    const keys: string[] = []
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key && key.startsWith(this.config.keyPrefix)) {
        keys.push(key)
      }
    }
    return keys
  }
}

// IndexedDB cache layer
class IndexedDBCache {
  private db: IDBDatabase | null = null
  private initialized = false

  async init(): Promise<void> {
    if (this.initialized) return

    try {
      const config = CACHE_CONFIG.layers.indexedDB
      
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(config.dbName, config.version)
        
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          this.db = request.result
          this.initialized = true
          resolve()
        }
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          
          if (!db.objectStoreNames.contains(config.storeName)) {
            const store = db.createObjectStore(config.storeName, { keyPath: 'key' })
            store.createIndex('timestamp', 'timestamp', { unique: false })
          }
        }
      })
    } catch (error) {
      trackError(error as Error, { operation: 'indexeddb_init' })
      this.initialized = false
    }
  }

  async set(key: string, data: any, ttl: number = CACHE_CONFIG.layers.indexedDB.defaultTTL): Promise<boolean> {
    await this.init()
    
    if (!this.db) return false

    try {
      const serialized = JSON.stringify(data)
      const shouldCompress = CompressionUtils.shouldCompress(serialized)
      
      const entry = {
        key,
        data: shouldCompress ? CompressionUtils.compress(serialized) : data,
        timestamp: Date.now(),
        ttl,
        compressed: shouldCompress
      }

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([CACHE_CONFIG.layers.indexedDB.storeName], 'readwrite')
        const store = transaction.objectStore(CACHE_CONFIG.layers.indexedDB.storeName)
        
        const request = store.put(entry)
        request.onsuccess = () => {
          this.maintainSize()
          resolve(true)
        }
        request.onerror = () => {
          trackError(new Error(`IndexedDB set failed: ${request.error}`), { key })
          resolve(false)
        }
      })
    } catch (error) {
      trackError(error as Error, { operation: 'indexeddb_set', key })
      return false
    }
  }

  async get(key: string): Promise<any | null> {
    await this.init()
    
    if (!this.db) return null

    try {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([CACHE_CONFIG.layers.indexedDB.storeName], 'readonly')
        const store = transaction.objectStore(CACHE_CONFIG.layers.indexedDB.storeName)
        
        const request = store.get(key)
        request.onsuccess = () => {
          const entry = request.result
          
          if (!entry) {
            resolve(null)
            return
          }

          // Check expiration
          if (Date.now() - entry.timestamp > entry.ttl) {
            this.delete(key)
            resolve(null)
            return
          }

          const data = entry.compressed ? 
            JSON.parse(CompressionUtils.decompress(entry.data)) : 
            entry.data

          resolve(data)
        }
        request.onerror = () => {
          trackError(new Error(`IndexedDB get failed: ${request.error}`), { key })
          resolve(null)
        }
      })
    } catch (error) {
      trackError(error as Error, { operation: 'indexeddb_get', key })
      return null
    }
  }

  async delete(key: string): Promise<boolean> {
    await this.init()
    
    if (!this.db) return false

    try {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([CACHE_CONFIG.layers.indexedDB.storeName], 'readwrite')
        const store = transaction.objectStore(CACHE_CONFIG.layers.indexedDB.storeName)
        
        const request = store.delete(key)
        request.onsuccess = () => resolve(true)
        request.onerror = () => {
          trackError(new Error(`IndexedDB delete failed: ${request.error}`), { key })
          resolve(false)
        }
      })
    } catch (error) {
      trackError(error as Error, { operation: 'indexeddb_delete', key })
      return false
    }
  }

  async clear(): Promise<void> {
    await this.init()
    
    if (!this.db) return

    try {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([CACHE_CONFIG.layers.indexedDB.storeName], 'readwrite')
        const store = transaction.objectStore(CACHE_CONFIG.layers.indexedDB.storeName)
        
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => {
          trackError(new Error(`IndexedDB clear failed: ${request.error}`))
          resolve()
        }
      })
    } catch (error) {
      trackError(error as Error, { operation: 'indexeddb_clear' })
    }
  }

  private async maintainSize(): Promise<void> {
    if (!this.db) return

    try {
      const config = CACHE_CONFIG.layers.indexedDB
      
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([config.storeName], 'readwrite')
        const store = transaction.objectStore(config.storeName)
        const index = store.index('timestamp')
        
        const countRequest = store.count()
        countRequest.onsuccess = () => {
          if (countRequest.result > config.maxSize) {
            // Get oldest entries
            const cursorRequest = index.openCursor(null, 'next')
            let deleteCount = countRequest.result - config.maxSize
            
            cursorRequest.onsuccess = (event) => {
              const cursor = (event.target as IDBRequest).result
              if (cursor && deleteCount > 0) {
                store.delete(cursor.primaryKey)
                deleteCount--
                cursor.continue()
              } else {
                resolve()
              }
            }
          } else {
            resolve()
          }
        }
      })
    } catch (error) {
      trackError(error as Error, { operation: 'indexeddb_maintain' })
    }
  }
}

// Main cache manager
export class CacheManager {
  private memoryCache = new MemoryCache()
  private sessionCache = new BrowserStorageCache(sessionStorage, CACHE_CONFIG.layers.sessionStorage)
  private localCache = new BrowserStorageCache(localStorage, CACHE_CONFIG.layers.localStorage)
  private indexedCache = new IndexedDBCache()

  async set(key: string, data: any, options: {
    ttl?: number
    layers?: ('memory' | 'session' | 'local' | 'indexed')[]
    strategy?: 'all' | 'fallback'
  } = {}): Promise<boolean> {
    const { ttl = CACHE_CONFIG.layers.memory.defaultTTL, layers = ['memory', 'session', 'local'], strategy = 'all' } = options
    const startTime = performance.now()

    try {
      const results: boolean[] = []

      if (strategy === 'all') {
        // Set in all specified layers
        if (layers.includes('memory') && CACHE_CONFIG.layers.memory.enabled) {
          results.push(this.memoryCache.set(key, data, ttl))
        }
        if (layers.includes('session') && CACHE_CONFIG.layers.sessionStorage.enabled) {
          results.push(this.sessionCache.set(key, data, ttl))
        }
        if (layers.includes('local') && CACHE_CONFIG.layers.localStorage.enabled) {
          results.push(this.localCache.set(key, data, ttl))
        }
        if (layers.includes('indexed') && CACHE_CONFIG.layers.indexedDB.enabled) {
          results.push(await this.indexedCache.set(key, data, ttl))
        }
      } else {
        // Fallback strategy - try each layer until one succeeds
        for (const layer of layers) {
          let success = false
          
          switch (layer) {
            case 'memory':
              if (CACHE_CONFIG.layers.memory.enabled) {
                success = this.memoryCache.set(key, data, ttl)
              }
              break
            case 'session':
              if (CACHE_CONFIG.layers.sessionStorage.enabled) {
                success = this.sessionCache.set(key, data, ttl)
              }
              break
            case 'local':
              if (CACHE_CONFIG.layers.localStorage.enabled) {
                success = this.localCache.set(key, data, ttl)
              }
              break
            case 'indexed':
              if (CACHE_CONFIG.layers.indexedDB.enabled) {
                success = await this.indexedCache.set(key, data, ttl)
              }
              break
          }

          if (success) {
            results.push(true)
            break
          }
        }
      }

      const success = results.some(r => r)
      
      trackPerformance('cache_set', performance.now() - startTime, {
        key,
        layers: layers.join(','),
        strategy,
        success
      })

      return success
    } catch (error) {
      trackError(error as Error, { operation: 'cache_set', key })
      return false
    }
  }

  async get(key: string, layers: ('memory' | 'session' | 'local' | 'indexed')[] = ['memory', 'session', 'local']): Promise<any | null> {
    const startTime = performance.now()

    try {
      // Try each layer in order until we find the data
      for (const layer of layers) {
        let data: any = null

        switch (layer) {
          case 'memory':
            if (CACHE_CONFIG.layers.memory.enabled) {
              data = this.memoryCache.get(key)
            }
            break
          case 'session':
            if (CACHE_CONFIG.layers.sessionStorage.enabled) {
              data = this.sessionCache.get(key)
            }
            break
          case 'local':
            if (CACHE_CONFIG.layers.localStorage.enabled) {
              data = this.localCache.get(key)
            }
            break
          case 'indexed':
            if (CACHE_CONFIG.layers.indexedDB.enabled) {
              data = await this.indexedCache.get(key)
            }
            break
        }

        if (data !== null) {
          // Promote data to higher layers for faster future access
          await this.promoteToHigherLayers(key, data, layer, layers)
          
          trackPerformance('cache_get_hit', performance.now() - startTime, {
            key,
            layer,
            promoted: true
          })

          return data
        }
      }

      trackPerformance('cache_get_miss', performance.now() - startTime, {
        key,
        layers: layers.join(',')
      })

      return null
    } catch (error) {
      trackError(error as Error, { operation: 'cache_get', key })
      return null
    }
  }

  private async promoteToHigherLayers(key: string, data: any, foundLayer: string, searchedLayers: string[]): Promise<void> {
    const layerOrder = ['memory', 'session', 'local', 'indexed']
    const foundIndex = layerOrder.indexOf(foundLayer)
    
    // Promote to all higher layers that were searched
    for (let i = 0; i < foundIndex; i++) {
      const layer = layerOrder[i]
      if (layer && searchedLayers.includes(layer)) {
        switch (layer) {
          case 'memory':
            this.memoryCache.set(key, data)
            break
          case 'session':
            this.sessionCache.set(key, data)
            break
          case 'local':
            this.localCache.set(key, data)
            break
        }
      }
    }
  }

  async delete(key: string, layers: ('memory' | 'session' | 'local' | 'indexed')[] = ['memory', 'session', 'local', 'indexed']): Promise<boolean> {
    const results: boolean[] = []

    if (layers.includes('memory')) {
      results.push(this.memoryCache.delete(key))
    }
    if (layers.includes('session')) {
      results.push(this.sessionCache.delete(key))
    }
    if (layers.includes('local')) {
      results.push(this.localCache.delete(key))
    }
    if (layers.includes('indexed')) {
      results.push(await this.indexedCache.delete(key))
    }

    return results.some(r => r)
  }

  async clear(layers: ('memory' | 'session' | 'local' | 'indexed')[] = ['memory', 'session', 'local', 'indexed']): Promise<void> {
    if (layers.includes('memory')) {
      this.memoryCache.clear()
    }
    if (layers.includes('session')) {
      this.sessionCache.clear()
    }
    if (layers.includes('local')) {
      this.localCache.clear()
    }
    if (layers.includes('indexed')) {
      await this.indexedCache.clear()
    }
  }

  getStats(): {
    memory: CacheStats
    totalMemoryUsage: string
    layersEnabled: string[]
  } {
    const memoryStats = this.memoryCache.getStats()
    
    return {
      memory: memoryStats,
      totalMemoryUsage: `${(memoryStats.memoryUsage / 1024 / 1024).toFixed(2)} MB`,
      layersEnabled: Object.entries(CACHE_CONFIG.layers)
        .filter(([_, config]) => config.enabled)
        .map(([name]) => name)
    }
  }
}

// Create singleton instance
export const cacheManager = new CacheManager()

// Utility functions
export const cache = {
  set: (key: string, data: any, options?: any) => cacheManager.set(key, data, options),
  get: (key: string, layers?: any[]) => cacheManager.get(key, layers),
  delete: (key: string, layers?: any[]) => cacheManager.delete(key, layers),
  clear: (layers?: any[]) => cacheManager.clear(layers),
  getStats: () => cacheManager.getStats()
}

// React hook for cache operations
export const useCache = () => {
  return cache
}
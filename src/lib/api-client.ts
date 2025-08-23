/**
 * Optimized API Client with caching, batching, and retry logic
 * Provides intelligent request management for improved performance
 */

import { trackError, trackPerformance } from '../../lib/monitoring'

// Configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second base delay
  batchDelay: 50, // 50ms batching window
  cacheTimeout: 5 * 60 * 1000, // 5 minutes default cache
  maxCacheSize: 200,
  enableBatching: true,
  enableRetry: true,
  enableCache: true,
  debug: import.meta.env.DEV
}

// Request cache
class ApiCache {
  private cache: Map<string, { data: any; timestamp: number; maxAge: number }> = new Map()

  set(key: string, data: any, maxAge: number = API_CONFIG.cacheTimeout): void {
    // Cleanup old entries if cache is full
    if (this.cache.size >= API_CONFIG.maxCacheSize) {
      const entries = Array.from(this.cache.entries())
      const oldestEntry = entries.reduce((oldest, current) => 
        current[1].timestamp < oldest[1].timestamp ? current : oldest
      )
      this.cache.delete(oldestEntry[0])
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      maxAge
    })

    if (API_CONFIG.debug) {
      console.log(`[ApiCache] Cached: ${key}`)
    }
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    if (Date.now() - entry.timestamp > entry.maxAge) {
      this.cache.delete(key)
      
      if (API_CONFIG.debug) {
        console.log(`[ApiCache] Expired: ${key}`)
      }
      
      return null
    }

    if (API_CONFIG.debug) {
      console.log(`[ApiCache] Hit: ${key}`)
    }

    return entry.data
  }

  invalidate(pattern: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern)
    )

    keysToDelete.forEach(key => this.cache.delete(key))

    if (API_CONFIG.debug) {
      console.log(`[ApiCache] Invalidated ${keysToDelete.length} entries matching: ${pattern}`)
    }
  }

  clear(): void {
    this.cache.clear()
    
    if (API_CONFIG.debug) {
      console.log('[ApiCache] Cleared all entries')
    }
  }

  getStats(): { size: number; memoryUsage: string } {
    const memoryUsage = JSON.stringify(Array.from(this.cache.values())).length
    
    return {
      size: this.cache.size,
      memoryUsage: `${(memoryUsage / 1024).toFixed(2)} KB`
    }
  }
}

// Request batching
class RequestBatcher {
  private batchQueue: Map<string, {
    requests: Array<{
      resolve: (value: any) => void
      reject: (error: any) => void
      timestamp: number
    }>
    timer: NodeJS.Timeout | null
  }> = new Map()

  addRequest(endpoint: string, options: RequestInit): Promise<any> {
    return new Promise((resolve, reject) => {
      const batchKey = this.generateBatchKey(endpoint, options)
      
      if (!this.batchQueue.has(batchKey)) {
        this.batchQueue.set(batchKey, {
          requests: [],
          timer: null
        })
      }

      const batch = this.batchQueue.get(batchKey)!
      batch.requests.push({ resolve, reject, timestamp: Date.now() })

      // Clear existing timer and set new one
      if (batch.timer) {
        clearTimeout(batch.timer)
      }

      batch.timer = setTimeout(() => {
        this.executeBatch(batchKey, endpoint, options)
      }, API_CONFIG.batchDelay)
    })
  }

  private generateBatchKey(endpoint: string, options: RequestInit): string {
    // Generate key based on endpoint and method
    const method = options.method || 'GET'
    return `${method}:${endpoint}`
  }

  private async executeBatch(batchKey: string, endpoint: string, options: RequestInit): Promise<void> {
    const batch = this.batchQueue.get(batchKey)
    if (!batch) return

    this.batchQueue.delete(batchKey)

    try {
      // For GET requests, we can't truly batch them, so execute individually
      // For POST/PUT requests, we could potentially batch the payloads
      const method = options.method || 'GET'
      
      if (method === 'GET') {
        // Execute all GET requests in parallel
        const promises = batch.requests.map(() => 
          this.executeRequest(endpoint, options)
        )
        
        const results = await Promise.allSettled(promises)
        
        results.forEach((result, index) => {
          const request = batch.requests[index]
          if (request && result.status === 'fulfilled') {
            request.resolve(result.value)
          } else if (request && result.status === 'rejected') {
            request.reject(result.reason)
          }
        })
      } else {
        // For other methods, execute the request once and share the result
        try {
          const result = await this.executeRequest(endpoint, options)
          batch.requests.forEach(req => req.resolve(result))
        } catch (error) {
          batch.requests.forEach(req => req.reject(error))
        }
      }

    } catch (error) {
      batch.requests.forEach(req => req.reject(error))
    }
  }

  private async executeRequest(endpoint: string, options: RequestInit): Promise<any> {
    const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }
}

// Main API client class
export class OptimizedApiClient {
  private cache = new ApiCache()
  private batcher = new RequestBatcher()
  private requestQueue: Map<string, Promise<any>> = new Map()

  // Standard HTTP methods with optimization
  async get(endpoint: string, options: {
    cache?: boolean | number
    timeout?: number
    retries?: number
    signal?: AbortSignal
  } = {}): Promise<any> {
    const cacheKey = `GET:${endpoint}`
    const startTime = performance.now()

    try {
      // Check cache first
      if (options.cache !== false && API_CONFIG.enableCache) {
        const cachedData = this.cache.get(cacheKey)
        if (cachedData) {
          trackPerformance('api_cache_hit', performance.now() - startTime, {
            endpoint,
            method: 'GET'
          })
          return cachedData
        }
      }

      // Check if request is already in progress
      const existingRequest = this.requestQueue.get(cacheKey)
      if (existingRequest) {
        return await existingRequest
      }

      // Create request promise
      const requestPromise = this.executeWithRetry(
        () => this.makeRequest('GET', endpoint, {}, options),
        options.retries || API_CONFIG.retryAttempts
      )

      // Store in request queue to prevent duplicate requests
      this.requestQueue.set(cacheKey, requestPromise)

      const result = await requestPromise

      // Remove from queue
      this.requestQueue.delete(cacheKey)

      // Cache successful results
      if (options.cache !== false && API_CONFIG.enableCache) {
        const cacheTimeout = typeof options.cache === 'number' ? options.cache : API_CONFIG.cacheTimeout
        this.cache.set(cacheKey, result, cacheTimeout)
      }

      trackPerformance('api_request_success', performance.now() - startTime, {
        endpoint,
        method: 'GET',
        cached: false
      })

      return result

    } catch (error) {
      // Remove from queue on error
      this.requestQueue.delete(cacheKey)
      
      trackError(error as Error, {
        endpoint,
        method: 'GET',
        duration: performance.now() - startTime
      })

      throw error
    }
  }

  async post(endpoint: string, data?: any, options: {
    timeout?: number
    retries?: number
    signal?: AbortSignal
  } = {}): Promise<any> {
    const startTime = performance.now()

    try {
      const result = await this.executeWithRetry(
        () => this.makeRequest('POST', endpoint, data, options),
        options.retries || API_CONFIG.retryAttempts
      )

      // Invalidate related cache entries
      this.cache.invalidate(endpoint.split('/')[1] || endpoint)

      trackPerformance('api_request_success', performance.now() - startTime, {
        endpoint,
        method: 'POST'
      })

      return result

    } catch (error) {
      trackError(error as Error, {
        endpoint,
        method: 'POST',
        duration: performance.now() - startTime
      })

      throw error
    }
  }

  async put(endpoint: string, data?: any, options: {
    timeout?: number
    retries?: number
    signal?: AbortSignal
  } = {}): Promise<any> {
    const startTime = performance.now()

    try {
      const result = await this.executeWithRetry(
        () => this.makeRequest('PUT', endpoint, data, options),
        options.retries || API_CONFIG.retryAttempts
      )

      // Invalidate related cache entries
      this.cache.invalidate(endpoint.split('/')[1] || endpoint)

      trackPerformance('api_request_success', performance.now() - startTime, {
        endpoint,
        method: 'PUT'
      })

      return result

    } catch (error) {
      trackError(error as Error, {
        endpoint,
        method: 'PUT',
        duration: performance.now() - startTime
      })

      throw error
    }
  }

  async delete(endpoint: string, options: {
    timeout?: number
    retries?: number
    signal?: AbortSignal
  } = {}): Promise<any> {
    const startTime = performance.now()

    try {
      const result = await this.executeWithRetry(
        () => this.makeRequest('DELETE', endpoint, undefined, options),
        options.retries || API_CONFIG.retryAttempts
      )

      // Invalidate related cache entries
      this.cache.invalidate(endpoint.split('/')[1] || endpoint)

      trackPerformance('api_request_success', performance.now() - startTime, {
        endpoint,
        method: 'DELETE'
      })

      return result

    } catch (error) {
      trackError(error as Error, {
        endpoint,
        method: 'DELETE',
        duration: performance.now() - startTime
      })

      throw error
    }
  }

  // Batch multiple requests
  async batch(requests: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    endpoint: string
    data?: any
    options?: any
  }>): Promise<any[]> {
    const startTime = performance.now()

    try {
      const promises = requests.map(req => {
        switch (req.method) {
          case 'GET':
            return this.get(req.endpoint, req.options)
          case 'POST':
            return this.post(req.endpoint, req.data, req.options)
          case 'PUT':
            return this.put(req.endpoint, req.data, req.options)
          case 'DELETE':
            return this.delete(req.endpoint, req.options)
        }
      })

      const results = await Promise.allSettled(promises)

      trackPerformance('api_batch_request', performance.now() - startTime, {
        requestCount: requests.length,
        successCount: results.filter(r => r.status === 'fulfilled').length
      })

      return results.map(result => 
        result.status === 'fulfilled' ? result.value : { error: result.reason }
      )

    } catch (error) {
      trackError(error as Error, {
        operation: 'batch_request',
        requestCount: requests.length
      })

      throw error
    }
  }

  // Core request method
  private async makeRequest(
    method: string,
    endpoint: string,
    data?: any,
    options: any = {}
  ): Promise<any> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || API_CONFIG.timeout)

    try {
      let body: string | undefined
      if (data) {
        body = JSON.stringify(data)
      }

      // Use batching for GET requests if enabled
      if (method === 'GET' && API_CONFIG.enableBatching) {
        return await this.batcher.addRequest(endpoint, {
          method,
          signal: options.signal || controller.signal,
          headers: {
            'Content-Type': 'application/json'
          }
        })
      }

      const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        ...(body && { body }),
        signal: options.signal || controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()

    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // Retry logic with exponential backoff
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        // Don't retry on certain error types
        if (error instanceof Error) {
          if (error.message.includes('400') || error.message.includes('401') || error.message.includes('403')) {
            throw error
          }
        }

        if (attempt < maxRetries) {
          const delay = API_CONFIG.retryDelay * Math.pow(2, attempt) // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay))
          
          if (API_CONFIG.debug) {
            console.log(`[ApiClient] Retrying request (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms`)
          }
        }
      }
    }

    throw lastError!
  }

  // Cache management
  invalidateCache(pattern: string): void {
    this.cache.invalidate(pattern)
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): { size: number; memoryUsage: string } {
    return this.cache.getStats()
  }

  // Health check
  async checkHealth(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const startTime = performance.now()

    try {
      await this.get('/health', { cache: false, timeout: 5000, retries: 0 })
      
      return {
        healthy: true,
        latency: performance.now() - startTime
      }
    } catch (error) {
      return {
        healthy: false,
        latency: performance.now() - startTime,
        error: (error as Error).message
      }
    }
  }
}

// Create singleton instance
export const apiClient = new OptimizedApiClient()

// Utility functions
export const api = {
  get: (endpoint: string, options?: any) => apiClient.get(endpoint, options),
  post: (endpoint: string, data?: any, options?: any) => apiClient.post(endpoint, data, options),
  put: (endpoint: string, data?: any, options?: any) => apiClient.put(endpoint, data, options),
  delete: (endpoint: string, options?: any) => apiClient.delete(endpoint, options),
  batch: (requests: any[]) => apiClient.batch(requests),
  invalidateCache: (pattern: string) => apiClient.invalidateCache(pattern),
  clearCache: () => apiClient.clearCache(),
  getCacheStats: () => apiClient.getCacheStats(),
  checkHealth: () => apiClient.checkHealth()
}

// React hook for API operations
export const useApiClient = () => {
  return api
}
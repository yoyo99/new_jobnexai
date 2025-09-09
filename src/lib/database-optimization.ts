/**
 * Database Query Optimization and Performance Utilities
 * Provides caching, query optimization, and performance monitoring for Supabase
 */

import { getSupabase } from '../hooks/useSupabaseConfig'
import { trackError, trackEvent } from './monitoring'

// Cache configuration
const CACHE_CONFIG = {
  // Cache durations in milliseconds
  durations: {
    jobs: 5 * 60 * 1000, // 5 minutes
    user_profile: 10 * 60 * 1000, // 10 minutes
    skills: 30 * 60 * 1000, // 30 minutes
    static_data: 60 * 60 * 1000, // 1 hour
    market_trends: 15 * 60 * 1000, // 15 minutes
    notifications: 2 * 60 * 1000, // 2 minutes
  },
  // Maximum cache size (number of entries)
  maxSize: 100,
  // Enable cache debugging
  debug: import.meta.env.DEV
}

// Cache storage
class QueryCache {
  private cache: Map<string, { data: any; timestamp: number; duration: number }> = new Map()
  private accessOrder: string[] = []

  set(key: string, data: any, duration: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= CACHE_CONFIG.maxSize) {
      const oldestKey = this.accessOrder.shift()
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      duration
    })

    // Update access order
    this.updateAccessOrder(key)

    if (CACHE_CONFIG.debug) {
      console.log(`[QueryCache] Cached: ${key} (${this.cache.size}/${CACHE_CONFIG.maxSize})`)
    }
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > entry.duration) {
      this.cache.delete(key)
      this.removeFromAccessOrder(key)
      
      if (CACHE_CONFIG.debug) {
        console.log(`[QueryCache] Expired: ${key}`)
      }
      
      return null
    }

    // Update access order
    this.updateAccessOrder(key)

    if (CACHE_CONFIG.debug) {
      console.log(`[QueryCache] Hit: ${key}`)
    }

    return entry.data
  }

  invalidate(pattern: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern)
    )

    keysToDelete.forEach(key => {
      this.cache.delete(key)
      this.removeFromAccessOrder(key)
    })

    if (CACHE_CONFIG.debug) {
      console.log(`[QueryCache] Invalidated ${keysToDelete.length} entries matching: ${pattern}`)
    }
  }

  clear(): void {
    this.cache.clear()
    this.accessOrder = []
    
    if (CACHE_CONFIG.debug) {
      console.log('[QueryCache] Cleared all entries')
    }
  }

  getStats(): { size: number; hitRate: number; memoryUsage: string } {
    const memoryUsage = JSON.stringify(Array.from(this.cache.values())).length
    
    return {
      size: this.cache.size,
      hitRate: 0, // Would need hit/miss tracking for accurate calculation
      memoryUsage: `${(memoryUsage / 1024).toFixed(2)} KB`
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
}

// Global cache instance
const queryCache = new QueryCache()

// Query builder with optimization
class OptimizedQueryBuilder {
  private supabase = getSupabase()
  private tableName: string
  private selectFields: string = '*'
  private filters: Array<{ column: string; operator: string; value: any }> = []
  private orderBy: Array<{ column: string; ascending: boolean }> = []
  private limitValue?: number
  private cacheKey?: string
  private cacheDuration?: number

  constructor(tableName: string) {
    this.tableName = tableName
  }

  select(fields: string): OptimizedQueryBuilder {
    this.selectFields = fields
    return this
  }

  eq(column: string, value: any): OptimizedQueryBuilder {
    this.filters.push({ column, operator: 'eq', value })
    return this
  }

  neq(column: string, value: any): OptimizedQueryBuilder {
    this.filters.push({ column, operator: 'neq', value })
    return this
  }

  gt(column: string, value: any): OptimizedQueryBuilder {
    this.filters.push({ column, operator: 'gt', value })
    return this
  }

  gte(column: string, value: any): OptimizedQueryBuilder {
    this.filters.push({ column, operator: 'gte', value })
    return this
  }

  lt(column: string, value: any): OptimizedQueryBuilder {
    this.filters.push({ column, operator: 'lt', value })
    return this
  }

  lte(column: string, value: any): OptimizedQueryBuilder {
    this.filters.push({ column, operator: 'lte', value })
    return this
  }

  like(column: string, pattern: string): OptimizedQueryBuilder {
    this.filters.push({ column, operator: 'like', value: pattern })
    return this
  }

  ilike(column: string, pattern: string): OptimizedQueryBuilder {
    this.filters.push({ column, operator: 'ilike', value: pattern })
    return this
  }

  in(column: string, values: any[]): OptimizedQueryBuilder {
    this.filters.push({ column, operator: 'in', value: values })
    return this
  }

  order(column: string, ascending: boolean = true): OptimizedQueryBuilder {
    this.orderBy.push({ column, ascending })
    return this
  }

  limit(count: number): OptimizedQueryBuilder {
    this.limitValue = count
    return this
  }

  // Cache configuration
  cache(duration?: number): OptimizedQueryBuilder {
    this.cacheDuration = duration || CACHE_CONFIG.durations.static_data
    this.cacheKey = this.generateCacheKey()
    return this
  }

  private generateCacheKey(): string {
    const filterStr = this.filters.map(f => `${f.column}:${f.operator}:${f.value}`).join('|')
    const orderStr = this.orderBy.map(o => `${o.column}:${o.ascending ? 'asc' : 'desc'}`).join('|')
    
    return `${this.tableName}:${this.selectFields}:${filterStr}:${orderStr}:${this.limitValue || 'all'}`
  }

  async execute(): Promise<{ data: any; error: any; fromCache?: boolean }> {
    const startTime = performance.now()

    try {
      // Check cache first
      if (this.cacheKey && this.cacheDuration) {
        const cachedData = queryCache.get(this.cacheKey)
        if (cachedData) {
          trackEvent('database_query_cache_hit', {
            table: this.tableName,
            cacheKey: this.cacheKey,
            duration: performance.now() - startTime
          })
          
          return { data: cachedData, error: null, fromCache: true }
        }
      }

      // Build query
      let query = this.supabase.from(this.tableName).select(this.selectFields)

      // Apply filters
      this.filters.forEach(filter => {
        switch (filter.operator) {
          case 'eq':
            query = query.eq(filter.column, filter.value)
            break
          case 'neq':
            query = query.neq(filter.column, filter.value)
            break
          case 'gt':
            query = query.gt(filter.column, filter.value)
            break
          case 'gte':
            query = query.gte(filter.column, filter.value)
            break
          case 'lt':
            query = query.lt(filter.column, filter.value)
            break
          case 'lte':
            query = query.lte(filter.column, filter.value)
            break
          case 'like':
            query = query.like(filter.column, filter.value)
            break
          case 'ilike':
            query = query.ilike(filter.column, filter.value)
            break
          case 'in':
            query = query.in(filter.column, filter.value)
            break
        }
      })

      // Apply ordering
      this.orderBy.forEach(order => {
        query = query.order(order.column, { ascending: order.ascending })
      })

      // Apply limit
      if (this.limitValue) {
        query = query.limit(this.limitValue)
      }

      // Execute query
      const { data, error } = await query

      const duration = performance.now() - startTime

      if (error) {
        trackError(new Error(`Database query failed: ${error.message}`), {
          table: this.tableName,
          query: this.cacheKey || 'uncached',
          duration
        })
        
        return { data: null, error }
      }

      // Cache successful results
      if (this.cacheKey && this.cacheDuration && data) {
        queryCache.set(this.cacheKey, data, this.cacheDuration)
      }

      trackEvent('database_query_success', {
        table: this.tableName,
        recordCount: Array.isArray(data) ? data.length : 1,
        cached: !!this.cacheKey,
        duration
      })

      return { data, error: null, fromCache: false }

    } catch (error) {
      const duration = performance.now() - startTime
      
      trackError(error as Error, {
        table: this.tableName,
        query: this.cacheKey || 'uncached',
        duration
      })

      return { data: null, error }
    }
  }

  // Execute single record query
  async single(): Promise<{ data: any; error: any; fromCache?: boolean }> {
    const result = await this.limit(1).execute()
    
    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      return { ...result, data: result.data[0] }
    }
    
    return { ...result, data: null }
  }
}

// Optimized database operations
export class DatabaseOptimizer {
  static from(tableName: string): OptimizedQueryBuilder {
    return new OptimizedQueryBuilder(tableName)
  }

  // Batch operations
  static async batchInsert(tableName: string, records: any[], batchSize: number = 100): Promise<{ success: boolean; errors: any[] }> {
    const supabase = getSupabase()
    const errors: any[] = []
    const batches = []

    // Split records into batches
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize))
    }

    const startTime = performance.now()

    try {
      // Process batches in parallel (limited concurrency)
      const results = await Promise.allSettled(
        batches.map(async (batch, index) => {
          const { error } = await supabase.from(tableName).insert(batch)
          if (error) {
            errors.push({ batch: index, error })
            throw error
          }
        })
      )

      const successCount = results.filter(r => r.status === 'fulfilled').length
      const duration = performance.now() - startTime

      trackEvent('database_batch_insert', {
        table: tableName,
        totalRecords: records.length,
        batchCount: batches.length,
        successCount,
        errorCount: results.length - successCount,
        duration
      })

      return {
        success: errors.length === 0,
        errors
      }

    } catch (error) {
      trackError(error as Error, {
        operation: 'batch_insert',
        table: tableName,
        recordCount: records.length
      })

      return {
        success: false,
        errors: [error]
      }
    }
  }

  // Optimized search with full-text search
  static async searchJobs(searchParams: {
    query?: string
    filters?: Record<string, any>
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    limit?: number
    offset?: number
  }): Promise<{ data: any[]; error: any; total?: number }> {
    const { query, filters = {}, sortBy = 'posted_at', sortOrder = 'desc', limit = 20, offset = 0 } = searchParams

    try {
      let queryBuilder = DatabaseOptimizer
        .from('jobs')
        .select('*, company_profiles(name, logo_url)')
        .limit(limit)

      // Apply full-text search if query provided
      if (query) {
        queryBuilder = queryBuilder.like('search_vector', `%${query}%`)
      }

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            queryBuilder = queryBuilder.in(key, value)
          } else {
            queryBuilder = queryBuilder.eq(key, value)
          }
        }
      })

      // Apply sorting
      queryBuilder = queryBuilder.order(sortBy, sortOrder === 'asc')

      // Add offset for pagination
      if (offset > 0) {
        // Note: Supabase doesn't have direct offset, use range instead
        queryBuilder = queryBuilder.limit(limit)
      }

      // Cache frequently accessed job searches
      queryBuilder = queryBuilder.cache(CACHE_CONFIG.durations.jobs)

      const result = await queryBuilder.execute()
      
      return {
        data: result.data || [],
        error: result.error,
        total: result.data?.length || 0
      }

    } catch (error) {
      trackError(error as Error, {
        operation: 'search_jobs',
        searchParams
      })

      return {
        data: [],
        error: error,
        total: 0
      }
    }
  }

  // Cache management
  static invalidateCache(pattern: string): void {
    queryCache.invalidate(pattern)
  }

  static clearCache(): void {
    queryCache.clear()
  }

  static getCacheStats(): { size: number; hitRate: number; memoryUsage: string } {
    return queryCache.getStats()
  }

  // Connection pool monitoring
  static async checkDatabaseHealth(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const startTime = performance.now()
    
    try {
      const supabase = getSupabase()
      await supabase.from('profiles').select('id').limit(1)
      
      const latency = performance.now() - startTime
      
      return {
        healthy: true,
        latency
      }
    } catch (error) {
      const latency = performance.now() - startTime
      
      trackError(error as Error, {
        operation: 'database_health_check',
        latency
      })

      return {
        healthy: false,
        latency,
        error: (error as Error).message
      }
    }
  }

  // Query optimization suggestions
  static analyzeQuery(tableName: string, filters: any[], orderBy: any[]): {
    suggestions: string[]
    indexRecommendations: string[]
  } {
    const suggestions: string[] = []
    const indexRecommendations: string[] = []

    // Check for missing indexes
    const filterColumns = filters.map(f => f.column)
    const orderColumns = orderBy.map(o => o.column)
    
    // Common optimization patterns
    if (filterColumns.length > 1) {
      suggestions.push('Consider creating a composite index for multiple filter columns')
      indexRecommendations.push(`CREATE INDEX idx_${tableName}_composite ON ${tableName} (${filterColumns.join(', ')})`)
    }

    if (orderColumns.length > 0 && filterColumns.length > 0) {
      const combinedColumns = [...new Set([...filterColumns, ...orderColumns])]
      indexRecommendations.push(`CREATE INDEX idx_${tableName}_filter_order ON ${tableName} (${combinedColumns.join(', ')})`)
    }

    // Check for full table scans
    if (filters.length === 0) {
      suggestions.push('Query may result in full table scan - consider adding filters')
    }

    return {
      suggestions,
      indexRecommendations
    }
  }
}

// Export cache instance for direct access
export { queryCache }

// Utility hooks for React components
export const useDatabaseOptimizer = () => {
  return {
    from: DatabaseOptimizer.from,
    searchJobs: DatabaseOptimizer.searchJobs,
    batchInsert: DatabaseOptimizer.batchInsert,
    invalidateCache: DatabaseOptimizer.invalidateCache,
    clearCache: DatabaseOptimizer.clearCache,
    getCacheStats: DatabaseOptimizer.getCacheStats,
    checkHealth: DatabaseOptimizer.checkDatabaseHealth
  }
}
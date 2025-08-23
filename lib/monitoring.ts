import * as Sentry from '@sentry/react'
import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals'
import { supabase } from './supabase'

// Enhanced monitoring configuration
interface MonitoringConfig {
  enableSentry: boolean
  enableWebVitals: boolean
  enablePerformanceTracking: boolean
  enableUserBehaviorTracking: boolean
  enableErrorBoundary: boolean
  sampleRate: number
}

const config: MonitoringConfig = {
  enableSentry: !!import.meta.env.VITE_SENTRY_DSN,
  enableWebVitals: true,
  enablePerformanceTracking: true,
  enableUserBehaviorTracking: true,
  enableErrorBoundary: true,
  sampleRate: import.meta.env.PROD ? 0.1 : 1.0
}

// Performance metrics storage
class PerformanceTracker {
  private metrics: Array<{
    name: string
    value: number
    timestamp: number
    url: string
    userAgent: string
  }> = []

  private userActions: Array<{
    action: string
    timestamp: number
    duration?: number
    metadata?: Record<string, any>
  }> = []

  track(name: string, value: number, metadata?: Record<string, any>) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...metadata
    }

    this.metrics.push(metric)
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }

    // Send to analytics service
    this.sendMetric(metric)
  }

  trackUserAction(action: string, duration?: number, metadata?: Record<string, any>) {
    const actionData = {
      action,
      timestamp: Date.now(),
      ...(duration !== undefined && { duration }),
      ...(metadata !== undefined && { metadata })
    }

    this.userActions.push(actionData)
    
    if (this.userActions.length > 100) {
      this.userActions = this.userActions.slice(-100)
    }

    // Send user behavior data
    this.sendUserAction(actionData)
  }

  private async sendMetric(metric: any) {
    try {
      if (config.enablePerformanceTracking) {
        await supabase.from('performance_metrics').insert(metric)
      }
    } catch (error) {
      console.warn('Failed to send performance metric:', error)
    }
  }

  private async sendUserAction(action: any) {
    try {
      if (config.enableUserBehaviorTracking) {
        await supabase.from('user_actions').insert(action)
      }
    } catch (error) {
      console.warn('Failed to send user action:', error)
    }
  }

  getMetrics() {
    return [...this.metrics]
  }

  getUserActions() {
    return [...this.userActions]
  }
}

const performanceTracker = new PerformanceTracker()

// Enhanced error tracking
class ErrorTracker {
  private errors: Array<{
    error: Error
    timestamp: number
    context?: Record<string, any>
    userId?: string
    sessionId?: string
  }> = []

  async track(error: Error, context?: Record<string, any>) {
    const userId = await this.getCurrentUserId()
    const sessionId = this.getSessionId()
    
    const errorData = {
      error,
      timestamp: Date.now(),
      ...(context !== undefined && { context }),
      ...(userId !== undefined && { userId }),
      sessionId
    }

    this.errors.push(errorData)

    // Send to Sentry if enabled
    if (config.enableSentry) {
      Sentry.captureException(error, {
        ...(context && { tags: context }),
        ...(userId && { user: { id: userId } }),
        contexts: {
          session: { id: sessionId }
        }
      })
    }

    // Log to database
    this.sendErrorToDatabase(errorData)
  }

  private async getCurrentUserId(): Promise<string | undefined> {
    try {
      const { data } = await supabase.auth.getUser()
      return data.user?.id
    } catch {
      return undefined
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('session_id', sessionId)
    }
    return sessionId
  }

  private async sendErrorToDatabase(errorData: any) {
    try {
      await supabase.from('error_logs').insert({
        message: errorData.error.message,
        stack: errorData.error.stack,
        timestamp: errorData.timestamp,
        context: errorData.context,
        user_id: errorData.userId,
        session_id: errorData.sessionId,
        url: window.location.href,
        user_agent: navigator.userAgent
      })
    } catch (error) {
      console.warn('Failed to send error to database:', error)
    }
  }

  getErrors() {
    return [...this.errors]
  }
}

const errorTracker = new ErrorTracker()

// Web Vitals tracking with enhanced reporting
function trackWebVital(metric: Metric) {
  const vitalsData = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    timestamp: Date.now(),
    url: window.location.href,
    connection: (navigator as any).connection?.effectiveType || 'unknown'
  }

  performanceTracker.track(`web-vital-${metric.name}`, metric.value, vitalsData)

  // Send to Sentry with appropriate severity
  if (config.enableSentry) {
    const level = metric.rating === 'poor' ? 'warning' : 'info'
    Sentry.captureMessage(`Web Vital: ${metric.name}`, {
      level,
      tags: { 
        metric: metric.name, 
        rating: metric.rating,
        id: metric.id 
      },
      extra: vitalsData
    })
  }
}

// Resource loading performance
function trackResourcePerformance() {
  if (!window.performance) return

  const entries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  
  if (entries) {
    const metrics = {
      dns_lookup: entries.domainLookupEnd - entries.domainLookupStart,
      tcp_connect: entries.connectEnd - entries.connectStart,
      request_response: entries.responseEnd - entries.requestStart,
      dom_content_loaded: entries.domContentLoadedEventEnd - entries.domContentLoadedEventStart,
      page_load: entries.loadEventEnd - entries.loadEventStart
    }

    Object.entries(metrics).forEach(([name, value]) => {
      performanceTracker.track(`navigation-${name}`, value)
    })
  }
}

// Memory usage tracking
function trackMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    performanceTracker.track('memory-used', memory.usedJSHeapSize)
    performanceTracker.track('memory-total', memory.totalJSHeapSize)
    performanceTracker.track('memory-limit', memory.jsHeapSizeLimit)
  }
}

// API performance tracking
export function trackAPICall(endpoint: string, startTime: number, success: boolean, statusCode?: number) {
  const duration = Date.now() - startTime
  
  performanceTracker.track('api-call-duration', duration, {
    endpoint,
    success,
    statusCode,
    type: 'api'
  })
}

// User engagement tracking
export function trackUserEngagement() {
  let startTime = Date.now()
  let lastActivityTime = startTime

  const trackActivity = () => {
    lastActivityTime = Date.now()
  }

  // Track user interactions
  ['click', 'scroll', 'keypress', 'mousemove'].forEach(event => {
    document.addEventListener(event, trackActivity, { passive: true })
  })

  // Track session duration on page unload
  window.addEventListener('beforeunload', () => {
    const sessionDuration = lastActivityTime - startTime
    performanceTracker.trackUserAction('session_end', sessionDuration, {
      totalTime: Date.now() - startTime,
      activeTime: sessionDuration
    })
  })

  // Periodic engagement tracking
  setInterval(() => {
    const now = Date.now()
    const timeSinceLastActivity = now - lastActivityTime
    
    if (timeSinceLastActivity < 30000) { // Active within last 30 seconds
      performanceTracker.trackUserAction('engagement_check', undefined, {
        active: true,
        sessionDuration: now - startTime
      })
    }
  }, 60000) // Check every minute
}

// Main initialization function
export function initMonitoring() {
  console.log('🔍 Initializing monitoring system...')

  // Initialize Sentry
  if (config.enableSentry) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new Sentry.BrowserTracing({
          tracePropagationTargets: ['localhost', 'jobnexus.com', /^\//],
        }),
        new Sentry.Replay({
          maskAllText: false,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: config.sampleRate,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE,
      beforeSend(event) {
        // Filter out known non-critical errors
        if (event.exception) {
          const error = event.exception.values?.[0]
          if (error?.value?.includes('ResizeObserver loop limit exceeded')) {
            return null
          }
        }
        return event
      }
    })
    console.log('✅ Sentry initialized')
  }

  // Initialize Web Vitals tracking
  if (config.enableWebVitals) {
    onCLS(trackWebVital)
    onFID(trackWebVital)
    onFCP(trackWebVital)
    onLCP(trackWebVital)
    onTTFB(trackWebVital)
    console.log('✅ Web Vitals tracking initialized')
  }

  // Initialize performance tracking
  if (config.enablePerformanceTracking) {
    // Track initial page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        trackResourcePerformance()
        trackMemoryUsage()
      }, 1000)
    })

    // Track memory usage periodically
    setInterval(trackMemoryUsage, 30000)
    console.log('✅ Performance tracking initialized')
  }

  // Initialize user behavior tracking
  if (config.enableUserBehaviorTracking) {
    trackUserEngagement()
    console.log('✅ User behavior tracking initialized')
  }

  // Global error handler
  window.addEventListener('error', (event) => {
    errorTracker.track(event.error, {
      type: 'javascript_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    })
  })

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.track(new Error(event.reason), {
      type: 'unhandled_promise_rejection'
    })
  })

  console.log('🎯 Monitoring system fully initialized')
}

// Export utility functions
export function trackPerformance(name: string, duration: number, metadata?: Record<string, any>) {
  performanceTracker.track(name, duration, metadata)
}

export function trackError(error: Error, context?: Record<string, any>) {
  errorTracker.track(error, context)
}

export function trackEvent(name: string, data?: Record<string, any>) {
  performanceTracker.trackUserAction(name, undefined, data)
  
  if (config.enableSentry) {
    Sentry.captureMessage(name, {
      level: 'info',
      ...(data && { extra: data }),
    })
  }
}

export function trackPageView(page: string) {
  performanceTracker.trackUserAction('page_view', undefined, {
    page,
    timestamp: Date.now(),
    referrer: document.referrer
  })
}

export function getPerformanceMetrics() {
  return {
    metrics: performanceTracker.getMetrics(),
    userActions: performanceTracker.getUserActions(),
    errors: errorTracker.getErrors()
  }
}

// React Error Boundary integration
export const MonitoringErrorBoundary = Sentry.withErrorBoundary

export { performanceTracker, errorTracker }
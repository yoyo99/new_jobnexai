import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ClockIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { getPerformanceMetrics, trackEvent } from '../lib/monitoring'

interface MetricCard {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ComponentType<any>
}

interface PerformanceData {
  webVitals: {
    lcp: number
    fid: number
    cls: number
    fcp: number
    ttfb: number
  }
  pageLoad: {
    averageLoadTime: number
    slowestPage: string
    fastestPage: string
  }
  errors: {
    total: number
    jsErrors: number
    networkErrors: number
    recent: Array<{ message: string; timestamp: number }>
  }
  userMetrics: {
    activeUsers: number
    bounceRate: number
    averageSessionTime: number
    topPages: Array<{ page: string; views: number }>
  }
}

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalyticsData()
    trackEvent('analytics_dashboard_viewed', { timeRange })
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      // In a real implementation, this would fetch from your analytics API
      const metrics = getPerformanceMetrics()
      
      // Process and aggregate the data
      const processedData: PerformanceData = {
        webVitals: {
          lcp: calculateAverage(metrics.metrics.filter(m => m.name === 'web-vital-LCP')),
          fid: calculateAverage(metrics.metrics.filter(m => m.name === 'web-vital-FID')),
          cls: calculateAverage(metrics.metrics.filter(m => m.name === 'web-vital-CLS')),
          fcp: calculateAverage(metrics.metrics.filter(m => m.name === 'web-vital-FCP')),
          ttfb: calculateAverage(metrics.metrics.filter(m => m.name === 'web-vital-TTFB'))
        },
        pageLoad: {
          averageLoadTime: calculateAverage(metrics.metrics.filter(m => m.name.includes('navigation'))),
          slowestPage: '/app/jobs',
          fastestPage: '/app/dashboard'
        },
        errors: {
          total: metrics.errors.length,
          jsErrors: metrics.errors.filter(e => e.context?.type === 'javascript_error').length,
          networkErrors: metrics.errors.filter(e => e.context?.type === 'network_error').length,
          recent: metrics.errors.slice(-5).map(e => ({
            message: e.error.message,
            timestamp: e.timestamp
          }))
        },
        userMetrics: {
          activeUsers: metrics.userActions.filter(a => 
            a.timestamp > Date.now() - (24 * 60 * 60 * 1000)
          ).length,
          bounceRate: 0.25,
          averageSessionTime: calculateAverageSessionTime(metrics.userActions),
          topPages: aggregatePageViews(metrics.userActions)
        }
      }
      
      setData(processedData)
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAverage = (metrics: Array<{ value: number }>) => {
    if (metrics.length === 0) return 0
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
  }

  const calculateAverageSessionTime = (actions: Array<{ action: string; duration?: number }>) => {
    const sessions = actions.filter(a => a.action === 'session_end' && a.duration)
    if (sessions.length === 0) return 0
    return sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length
  }

  const aggregatePageViews = (actions: Array<{ action: string; metadata?: any }>) => {
    const pageViews = actions.filter(a => a.action === 'page_view')
    const pageCounts: Record<string, number> = {}
    
    pageViews.forEach(pv => {
      const page = pv.metadata?.page || 'unknown'
      pageCounts[page] = (pageCounts[page] || 0) + 1
    })
    
    return Object.entries(pageCounts)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getWebVitalRating = (metric: string, value: number) => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 }
    }
    
    const threshold = thresholds[metric]
    if (!threshold) return 'neutral'
    
    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  const metricCards: MetricCard[] = data ? [
    {
      title: 'Active Users',
      value: data.userMetrics.activeUsers,
      change: '+12%',
      trend: 'up',
      icon: UserIcon
    },
    {
      title: 'Avg Load Time',
      value: formatDuration(data.pageLoad.averageLoadTime),
      change: '-5%',
      trend: 'down',
      icon: ClockIcon
    },
    {
      title: 'Error Rate',
      value: `${((data.errors.total / data.userMetrics.activeUsers) * 100).toFixed(1)}%`,
      change: '+2%',
      trend: 'up',
      icon: ExclamationTriangleIcon
    },
    {
      title: 'Bounce Rate',
      value: `${(data.userMetrics.bounceRate * 100).toFixed(1)}%`,
      change: '-3%',
      trend: 'down',
      icon: GlobeAltIcon
    }
  ] : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
        <div className="flex space-x-2">
          {(['1h', '24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                timeRange === range
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">{card.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                {card.change && (
                  <p className={`text-sm mt-1 ${
                    card.trend === 'up' ? 'text-green-400' : 
                    card.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {card.change} from last period
                  </p>
                )}
              </div>
              <card.icon className="h-8 w-8 text-primary-400" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Web Vitals */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Core Web Vitals</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(data.webVitals).map(([metric, value]) => {
            const rating = getWebVitalRating(metric, value)
            const ratingColors = {
              good: 'text-green-400',
              'needs-improvement': 'text-yellow-400',
              poor: 'text-red-400',
              neutral: 'text-gray-400'
            }
            
            return (
              <div key={metric} className="text-center">
                <p className="text-gray-400 text-sm uppercase tracking-wide">{metric.toUpperCase()}</p>
                <p className={`text-xl font-bold ${ratingColors[rating]}`}>
                  {metric === 'cls' ? value.toFixed(3) : formatDuration(value)}
                </p>
                <div className={`w-full h-1 rounded-full mt-2 ${
                  rating === 'good' ? 'bg-green-400' :
                  rating === 'needs-improvement' ? 'bg-yellow-400' : 'bg-red-400'
                }`} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Charts and Additional Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Pages</h3>
          <div className="space-y-3">
            {data.userMetrics.topPages.map((page, _) => (
              <div key={page.page} className="flex justify-between items-center">
                <span className="text-gray-300">{page.page}</span>
                <span className="text-primary-400 font-medium">{page.views} views</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Errors */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Errors</h3>
          <div className="space-y-3">
            {data.errors.recent.length > 0 ? (
              data.errors.recent.map((error, index) => (
                <div key={index} className="text-sm">
                  <p className="text-red-400 truncate">{error.message}</p>
                  <p className="text-gray-500">
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent errors</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
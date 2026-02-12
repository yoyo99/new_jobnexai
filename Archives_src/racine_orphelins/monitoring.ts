import * as Sentry from '@sentry/react'
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals'

export function initMonitoring() {
  // Initialize Sentry
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: ['localhost', 'jobnexus.com'],
      }),
      new Sentry.Replay(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })

  // Measure Web Vitals
  onCLS(metric => {
    Sentry.captureMessage(`Web Vital: CLS`, {
      level: 'info',
      tags: { metric: 'CLS', id: metric.id },
      extra: { value: metric.value },
    })
  })

  onFID(metric => {
    Sentry.captureMessage(`Web Vital: FID`, {
      level: 'info',
      tags: { metric: 'FID', id: metric.id },
      extra: { value: metric.value },
    })
  })

  onFCP(metric => {
    Sentry.captureMessage(`Web Vital: FCP`, {
      level: 'info',
      tags: { metric: 'FCP', id: metric.id },
      extra: { value: metric.value },
    })
  })

  onLCP(metric => {
    Sentry.captureMessage(`Web Vital: LCP`, {
      level: 'info',
      tags: { metric: 'LCP', id: metric.id },
      extra: { value: metric.value },
    })
  })

  onTTFB(metric => {
    Sentry.captureMessage(`Web Vital: TTFB`, {
      level: 'info',
      tags: { metric: 'TTFB', id: metric.id },
      extra: { value: metric.value },
    })
  })
}

export function trackError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    tags: context,
  })
}

export function trackEvent(name: string, data?: Record<string, any>) {
  Sentry.captureMessage(name, {
    level: 'info',
    extra: data,
  })
}
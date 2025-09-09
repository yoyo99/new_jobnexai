import { initMonitoring, trackError, trackEvent } from '@/lib/monitoring'
import * as Sentry from '@sentry/react'
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals'

jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  BrowserTracing: jest.fn(),
  Replay: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

jest.mock('web-vitals', () => ({
  onCLS: jest.fn(),
  onFID: jest.fn(),
  onFCP: jest.fn(),
  onLCP: jest.fn(),
  onTTFB: jest.fn(),
}))

describe('Monitoring Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('initializes monitoring', () => {
    initMonitoring()

    expect(Sentry.init).toHaveBeenCalledWith({
      dsn: expect.any(String),
      integrations: expect.any(Array),
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    })

    expect(onCLS).toHaveBeenCalled()
    expect(onFID).toHaveBeenCalled()
    expect(onFCP).toHaveBeenCalled()
    expect(onLCP).toHaveBeenCalled()
    expect(onTTFB).toHaveBeenCalled()
  })

  test('tracks error with context', () => {
    const error = new Error('Test error')
    const context = { userId: '123', page: 'home' }

    trackError(error, context)

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: context,
    })
  })

  test('tracks event with data', () => {
    const eventName = 'button_click'
    const eventData = { buttonId: 'submit', page: 'checkout' }

    trackEvent(eventName, eventData)

    expect(Sentry.captureMessage).toHaveBeenCalledWith(eventName, {
      level: 'info',
      extra: eventData,
    })
  })

  test('tracks web vitals', () => {
    initMonitoring()

    // Simuler un événement CLS
    const clsCallback = (onCLS as any).mock.calls[0][0]
    clsCallback({ id: 'cls-1', value: 0.1 })

    expect(Sentry.captureMessage).toHaveBeenCalledWith('Web Vital: CLS', {
      level: 'info',
      tags: { metric: 'CLS', id: 'cls-1' },
      extra: { value: 0.1 },
    })

    // Simuler un événement FID
    const fidCallback = (onFID as any).mock.calls[0][0]
    fidCallback({ id: 'fid-1', value: 100 })

    expect(Sentry.captureMessage).toHaveBeenCalledWith('Web Vital: FID', {
      level: 'info',
      tags: { metric: 'FID', id: 'fid-1' },
      extra: { value: 100 },
    })
  })
})
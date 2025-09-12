import * as Sentry from '@sentry/react'
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals'

export function initMonitoring() {
  console.log('Initialisation du monitoring...')
  
  try {
    // Vérifier si la clé Sentry est disponible
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN
    
    if (!sentryDsn) {
      console.warn('DSN Sentry non définie. Le monitoring des erreurs est désactivé.')
      initWebVitalsOnly() // Initialiser seulement les web vitals sans Sentry
      return
    }
    
    // Initialize Sentry si la clé est disponible
    Sentry.init({
      dsn: sentryDsn,
      integrations: [
        new Sentry.BrowserTracing({
          tracePropagationTargets: ['localhost', 'jobnexus.com'],
        }),
        new Sentry.Replay(),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      // Ajouter un hook beforeSend pour éviter d'envoyer certaines erreurs
      beforeSend(event) {
        // Filtrer les erreurs non critiques pour éviter de surcharger Sentry
        if (event.exception && event.exception.values) {
          const errMsg = event.exception.values[0]?.value || '';
          
          // Ignorer les erreurs liées au réseau qui peuvent être temporaires
          if (errMsg.includes('NetworkError') || 
              errMsg.includes('Failed to fetch') || 
              errMsg.includes('Network request failed')) {
            return null;
          }
        }
        return event;
      },
    })
    
    // Initialiser les Web Vitals avec Sentry
    initWebVitalsWithSentry()
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de Sentry:', error)
    try {
      // Fallback: initialiser seulement les web vitals
      initWebVitalsOnly()
    } catch (vitalError) {
      console.error('Erreur lors de l\'initialisation des Web Vitals:', vitalError)
      // Continuer sans monitoring
    }
  }
}

// Fonction pour initialiser uniquement les Web Vitals sans Sentry
function initWebVitalsOnly() {
  try {
    onCLS(metric => { console.log('Web Vital: CLS', metric.value) })
    onFID(metric => { console.log('Web Vital: FID', metric.value) })
    onFCP(metric => { console.log('Web Vital: FCP', metric.value) })
    onLCP(metric => { console.log('Web Vital: LCP', metric.value) })
    onTTFB(metric => { console.log('Web Vital: TTFB', metric.value) })
  } catch (error) {
    console.warn('Impossible d\'initialiser les Web Vitals:', error)
  }
}

// Fonction pour initialiser les Web Vitals avec Sentry
function initWebVitalsWithSentry() {
  try {
    onCLS(metric => {
      try {
        Sentry.captureMessage(`Web Vital: CLS`, {
          level: 'info',
          tags: { metric: 'CLS', id: metric.id },
          extra: { value: metric.value },
        })
      } catch (e) {
        console.log('Web Vital: CLS', metric.value)
      }
    })
    
    onFID(metric => {
      try {
        Sentry.captureMessage(`Web Vital: FID`, {
          level: 'info',
          tags: { metric: 'FID', id: metric.id },
          extra: { value: metric.value },
        })
      } catch (e) {
        console.log('Web Vital: FID', metric.value)
      }
    })
    
    onFCP(metric => {
      try {
        Sentry.captureMessage(`Web Vital: FCP`, {
          level: 'info',
          tags: { metric: 'FCP', id: metric.id },
          extra: { value: metric.value },
        })
      } catch (e) {
        console.log('Web Vital: FCP', metric.value)
      }
    })
    
    onLCP(metric => {
      try {
        Sentry.captureMessage(`Web Vital: LCP`, {
          level: 'info',
          tags: { metric: 'LCP', id: metric.id },
          extra: { value: metric.value },
        })
      } catch (e) {
        console.log('Web Vital: LCP', metric.value)
      }
    })
    
    onTTFB(metric => {
      try {
        Sentry.captureMessage(`Web Vital: TTFB`, {
          level: 'info',
          tags: { metric: 'TTFB', id: metric.id },
          extra: { value: metric.value },
        })
      } catch (e) {
        console.log('Web Vital: TTFB', metric.value)
      }
    })
  } catch (error) {
    console.warn('Erreur lors de l\'initialisation des Web Vitals avec Sentry:', error)
    // Essayer d'initialiser sans Sentry en cas d'échec
    initWebVitalsOnly()
  }
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
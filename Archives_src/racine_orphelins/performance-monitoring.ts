import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

export function initPerformanceMonitoring() {
  // Initialiser le monitoring des Web Vitals
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

function sendToAnalytics(metric) {
  // Construire l'URL avec les paramètres de métrique
  const url = `/api/performance?${metric.name.toLowerCase()}=${metric.value}&url=${encodeURIComponent(window.location.pathname)}`;
  
  // Utiliser sendBeacon si disponible, sinon utiliser fetch
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url);
  } else {
    fetch(url, { method: 'POST', keepalive: true });
  }
  
  // Envoyer également à Sentry si disponible
  if (window.Sentry) {
    window.Sentry.captureMessage(`Web Vital: ${metric.name}`, {
      level: 'info',
      tags: { metric: metric.name },
      extra: { value: metric.value },
    });
  }
}

// Déclarer l'interface Sentry pour TypeScript
declare global {
  interface Window {
    Sentry?: {
      captureMessage: (message: string, options?: any) => void;
    };
  }
}
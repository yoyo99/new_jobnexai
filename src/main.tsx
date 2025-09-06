console.log('main.tsx is loaded');
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './minimal.css'
import './i18n/index'
import App from './App';
import { initMonitoring } from './lib/monitoring'
import { ThemeProvider } from './contexts/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Initialiser le monitoring
initMonitoring()

// Initialiser le monitoring des performances (désactivé pour l'instant)

// Créer un client React Query
const queryClient = new QueryClient();

// Enregistrer le Service Worker uniquement si activé explicitement
if (import.meta.env.VITE_ENABLE_PWA === 'true') {
  import('./lib/pwa').then(({ pwaManager }) => {
    console.log('PWA Manager initialized:', pwaManager)
  }).catch((err) => {
    console.warn('PWA initialization skipped or failed:', err)
  })
} else {
  console.log('PWA disabled (VITE_ENABLE_PWA !== "true").')
  // Forcer la désinscription des SW existants et la purge du cache si la PWA est désactivée
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then((regs) => {
        if (regs.length) console.log(`[PWA] Unregistering ${regs.length} service worker(s)`)
        regs.forEach(r => r.unregister())
      })
      .catch((err) => console.warn('[PWA] Failed to enumerate SW registrations', err))
  }
  if (typeof caches !== 'undefined' && caches.keys) {
    caches.keys()
      .then((names) => {
        if (names.length) console.log(`[PWA] Deleting ${names.length} cache(s)`) 
        return Promise.all(names.map(n => caches.delete(n)))
      })
      .catch((err) => console.warn('[PWA] Failed to delete caches', err))
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="jobnexai-ui-theme">
        <App />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
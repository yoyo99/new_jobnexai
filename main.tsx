import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ReactDOM from 'react-dom'
import './i18n'
import './index.css'
import App from './App.tsx'
import { initMonitoring } from './lib/monitoring'
import { initPerformanceMonitoring } from './lib/performance-monitoring'
import { pwaManager } from './src/lib/pwa'

// Initialize accessibility monitoring in development
if (import.meta.env.DEV) {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000)
  })
}

// Initialize monitoring systems
initMonitoring()
initPerformanceMonitoring()

// Initialize PWA manager
console.log('PWA Manager initialized:', pwaManager)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
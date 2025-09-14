console.log('main.tsx is loaded');
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './i18n'
import './index.css'
import App from './App';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { initMonitoring } from './lib/monitoring'
import { initPerformanceMonitoring } from './lib/performance-monitoring'
import { ThemeProvider } from './contexts/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Initialiser le monitoring
initMonitoring()

// Initialiser le monitoring des performances
// initPerformanceMonitoring()

// Créer un client React Query
const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="jobnexai-ui-theme">
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
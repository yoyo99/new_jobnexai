import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import ToastContainer from './ToastContainer';

// Importer les styles CSS ici, avant tout autre import
import './minimal.css';
import './App.css';

// Import immédiat des composants critiques pour la navigation
import { DashboardLayout } from './components/DashboardLayout'
import { ProtectedRoute } from './components/ProtectedRoute'

import { PrivacyConsent } from './components/PrivacyConsent'
import { SecurityBadge } from './components/SecurityBadge'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider } from './components/AuthProvider';
import { PWAInstall, ConnectionStatus, UpdateNotification } from './components/PWAInstall'
import { SubscriptionBanner } from './components/SubscriptionBanner'

// Import route modules
import { PublicRoutes } from './routes/PublicRoutes';
import { DevelopmentRoutes } from './routes/DevelopmentRoutes';
import { AppRoutes } from './routes/AppRoutes';

import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';
import './i18n.js';


function App() {
  // Gestionnaires d'erreurs globaux
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.warn('Global promise rejection caught:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18next}>
        <AuthProvider>
          <Router>
            {/* PWA Components */}
            <PWAInstall variant="banner" />
            <ConnectionStatus />
            <UpdateNotification />
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: '',
            style: {
              margin: '10px',
              background: '#333',
              color: '#fff',
              zIndex: 1000,
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981', // green-500
                secondary: '#FFFFFF',
              },
            },
            error: {
              duration: 5000,
            },
          }}
        />
            <Routes>
              {/* Public Routes */}
              <PublicRoutes />
              
              {/* Development Routes (only in dev mode) */}
              <DevelopmentRoutes />
              
              <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />
              
              {/* Legacy redirections */}
              <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
              <Route path="/letters" element={<Navigate to="/app/letters" replace />} />
              
              {/* Protected App Routes */}
              <Route 
                path="/app" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <AppRoutes />
              </Route>
              
              {/* 404 - Page non trouvée */}
              <Route path="*" element={<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-white mb-4">404</h1>
                  <p className="text-xl text-gray-300 mb-8">Page non trouvée</p>
                  <button 
                    onClick={() => window.location.href = '/'}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Retour à l'accueil
                  </button>
                </div>
              </div>} />
            </Routes>
            <PrivacyConsent />
            <SecurityBadge />
            <SubscriptionBanner />
            <ToastContainer />
          </Router>
        </AuthProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}

export default App;
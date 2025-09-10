import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

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
import { RedirectRoutes } from './routes/RedirectRoutes';
import { NotFoundPage } from './pages/NotFoundPage';

import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';


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

  // Désactivation temporaire de ErrorBoundary pour afficher les erreurs réelles
  console.log('App.tsx: rendu du AuthProvider');
  console.log('i18n is initialized:', i18n.isInitialized);
  // Test de rendu minimal
  return <div style={{color:'lime', fontSize: 32}}>TEST</div>;

}

export default App;
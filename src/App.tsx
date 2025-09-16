import { BrowserRouter as Router } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import ToastContainer from './ToastContainer';

// Importer les styles CSS ici, avant tout autre import
import './index.css';
import './App.css';

// Import des fournisseurs de contexte et composants globaux
import { PrivacyConsent } from './components/PrivacyConsent';
import { SecurityBadge } from './components/SecurityBadge';
import { SubscriptionBanner } from './components/SubscriptionBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './components/AuthProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { PublicRoutes } from './routes/PublicRoutes';
import { AppRoutes } from './routes/AppRoutes';


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
    <ErrorBoundary fallback={<div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="card max-w-lg mx-auto w-full bg-gradient-to-b from-background to-background/80 border-primary-500/20">
        <h2 className="text-2xl font-bold text-primary-400 mb-4">Un problème critique est survenu</h2>
        <p className="text-white/80 mb-6">L'application a rencontré une erreur et n'a pas pu charger correctement.</p>
        <button 
          onClick={() => window.location.reload()}
          className="btn-primary w-full"
        >
          Recharger l'application
        </button>
      </div>
    </div>}>
              <ThemeProvider defaultTheme="dark" storageKey="jobnexai-ui-theme">
        <AuthProvider>
          <Router>
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
            <PublicRoutes />
            <AppRoutes />
            <PrivacyConsent />
            <SecurityBadge />
            <SubscriptionBanner />
            <ToastContainer />
          </Router>
        </AuthProvider>
      </ThemeProvider>
          </ErrorBoundary>
  );
}

export default App;
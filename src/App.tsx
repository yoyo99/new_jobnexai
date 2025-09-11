import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Wrapper pour les composants lazy-loaded avec ErrorBoundary spécifique
 ({ children }: { children: React.ReactNode }) => {
  const ErrorBoundary = lazy(() => import('./components/ErrorBoundary').then(m => ({ default: m.ErrorBoundary })));
  const LoadingFallback = lazy(() => import('./components/LoadingFallback').then(m => ({ default: m.LoadingFallback })));
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorBoundary fallback={<div className="card m-8 text-center bg-background/80 backdrop-blur-lg">
        <h2 className="text-xl font-semibold text-primary-400 mb-4">Un problème est survenu lors du chargement de cette page</h2>
        <p className="text-white/80 mb-6">Nous nous excusons pour cet inconvénient. L'équipe technique a été informée du problème.</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Essayer de recharger</button>
      </div>}>
        <Suspense fallback={<LoadingFallback />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </Suspense>
  );
};

 lazy(() => import('./pages/LandingPage'));
 lazy(() => import('./components/SupabaseAuth'));
 lazy(() => import('./pages/PricingPage'));
 lazy(() => import('./components/PrivacyPolicy'));
 lazy(() => import('./components/pages/FeaturesPage'));
 lazy(() => import('./components/pages/HowItWorksPage'));
 lazy(() => import('./components/pages/TestimonialsPage'));
 lazy(() => import('./components/pages/AboutPage'));
 lazy(() => import('./components/pages/ContactPage'));
 lazy(() => import('./components/pages/TermsPage'));
 lazy(() => import('./components/ResetPassword'));
 lazy(() => import('./components/AuthCallback'));
 lazy(() => import('./components/StripeCheckoutStatus'));
 lazy(() => import('./components/ModernComponentsDemo').then(module => ({ default: module.ModernComponentsDemo })));
import { PublicRoute } from './components/PublicRoute';

// Importer les styles CSS ici, avant tout autre import
import './minimal.css';
import './App.css';

// Import immédiat des composants critiques pour la navigation
import { DashboardLayout } from './components/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PrivacyConsent } from './components/PrivacyConsent';
import { SecurityBadge } from './components/SecurityBadge';
import { AuthProvider } from './components/AuthProvider';
import { SubscriptionBanner } from './components/SubscriptionBanner';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { NotFoundPage } from './pages/NotFoundPage';


// Wrapper pour les composants lazy-loaded avec ErrorBoundary spécifique
 ({ children }: { children: React.ReactNode }) => {
  const ErrorBoundary = React.lazy(() => import('./components/ErrorBoundary').then(m => ({ default: m.ErrorBoundary })));
  const LoadingFallback = React.lazy(() => import('./components/LoadingFallback').then(m => ({ default: m.LoadingFallback })));
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <ErrorBoundary fallback={<div className="card m-8 text-center bg-background/80 backdrop-blur-lg">
        <h2 className="text-xl font-semibold text-primary-400 mb-4">Un problème est survenu lors du chargement de cette page</h2>
        <p className="text-white/80 mb-6">Nous nous excusons pour cet inconvénient. L'équipe technique a été informée du problème.</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Essayer de recharger</button>
      </div>}>
        <React.Suspense fallback={<LoadingFallback />}>
          {children}
        </React.Suspense>
      </ErrorBoundary>
    </React.Suspense>
  );
};

 React.lazy(() => import('./pages/LandingPage'));
 React.lazy(() => import('./components/SupabaseAuth'));
 React.lazy(() => import('./pages/PricingPage'));
 React.lazy(() => import('./components/PrivacyPolicy'));
 React.lazy(() => import('./components/pages/FeaturesPage'));
 React.lazy(() => import('./components/pages/HowItWorksPage'));
 React.lazy(() => import('./components/pages/TestimonialsPage'));
 React.lazy(() => import('./components/pages/AboutPage'));
 React.lazy(() => import('./components/pages/ContactPage'));
 React.lazy(() => import('./components/pages/TermsPage'));
 React.lazy(() => import('./components/ResetPassword'));
 React.lazy(() => import('./components/AuthCallback'));
 React.lazy(() => import('./components/StripeCheckoutStatus'));
 React.lazy(() => import('./components/ModernComponentsDemo').then(module => ({ default: module.ModernComponentsDemo })));

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

  // Test avec Router uniquement
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LazyComponentWrapper><JobNexAILanding /></LazyComponentWrapper>} />
            <Route path="/home" element={<LazyComponentWrapper><JobNexAILanding /></LazyComponentWrapper>} />
            <Route path="/login" element={<PublicRoute><LazyComponentWrapper><SupabaseAuth /></LazyComponentWrapper></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><LazyComponentWrapper><SupabaseAuth /></LazyComponentWrapper></PublicRoute>} />
            <Route path="/pricing" element={<LazyComponentWrapper><Pricing /></LazyComponentWrapper>} />
            <Route path="/demo" element={<LazyComponentWrapper><ModernComponentsDemo /></LazyComponentWrapper>} />
            <Route path="/privacy" element={<LazyComponentWrapper><PrivacyPolicy /></LazyComponentWrapper>} />
            <Route path="/about" element={<LazyComponentWrapper><AboutPage /></LazyComponentWrapper>} />
            <Route path="/contact" element={<LazyComponentWrapper><ContactPage /></LazyComponentWrapper>} />
            <Route path="/terms" element={<LazyComponentWrapper><TermsPage /></LazyComponentWrapper>} />
            <Route path="/features" element={<LazyComponentWrapper><FeaturesPage /></LazyComponentWrapper>} />
            <Route path="/how-it-works" element={<LazyComponentWrapper><HowItWorksPage /></LazyComponentWrapper>} />
            <Route path="/testimonials" element={<LazyComponentWrapper><TestimonialsPage /></LazyComponentWrapper>} />
            <Route path="/auth/reset-password" element={<LazyComponentWrapper><ResetPassword /></LazyComponentWrapper>} />
            <Route path="/auth/callback" element={<LazyComponentWrapper><AuthCallback /></LazyComponentWrapper>} />
            <Route path="/checkout/success" element={<LazyComponentWrapper><StripeCheckoutStatus /></LazyComponentWrapper>} />
          </Routes>
        </Router>
      </AuthProvider>
    </I18nextProvider>
  );

}

export default App;
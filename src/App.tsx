import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Wrapper pour les composants lazy-loaded avec ErrorBoundary spécifique
const LazyComponentWrapper = ({ children }: { children: React.ReactNode }) => {
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

const JobNexAILanding = lazy(() => import('./pages/LandingPage'));
const SupabaseAuth = lazy(() => import('./components/SupabaseAuth'));
const Pricing = lazy(() => import('./pages/PricingPage'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const FeaturesPage = lazy(() => import('./components/pages/FeaturesPage'));
const HowItWorksPage = lazy(() => import('./components/pages/HowItWorksPage'));
const TestimonialsPage = lazy(() => import('./components/pages/TestimonialsPage'));
const AboutPage = lazy(() => import('./components/pages/AboutPage'));
const ContactPage = lazy(() => import('./components/pages/ContactPage'));
const TermsPage = lazy(() => import('./components/pages/TermsPage'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const AuthCallback = lazy(() => import('./components/AuthCallback'));
const StripeCheckoutStatus = lazy(() => import('./components/StripeCheckoutStatus'));
const ModernComponentsDemo = lazy(() => import('./components/ModernComponentsDemo').then(module => ({ default: module.ModernComponentsDemo })));
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

            {/* Aliases /app/xxx pour toutes les pages publiques */}
            <Route path="/app/login" element={<Navigate to="/login" replace />} />
            <Route path="/app/register" element={<Navigate to="/register" replace />} />
            <Route path="/app/pricing" element={<Navigate to="/pricing" replace />} />
            <Route path="/app/privacy" element={<Navigate to="/privacy" replace />} />
            <Route path="/app/about" element={<Navigate to="/about" replace />} />
            <Route path="/app/contact" element={<Navigate to="/contact" replace />} />
            <Route path="/app/terms" element={<Navigate to="/terms" replace />} />
            <Route path="/app/features" element={<Navigate to="/features" replace />} />
            <Route path="/app/how-it-works" element={<Navigate to="/how-it-works" replace />} />
            <Route path="/app/testimonials" element={<Navigate to="/testimonials" replace />} />
            <Route path="/app/demo" element={<Navigate to="/demo" replace />} />

            <Route path="/app/*" element={<AppRoutes />} />
          </Routes>
        </Router>
      </AuthProvider>
    </I18nextProvider>
  );

}

export default App;
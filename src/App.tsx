import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { Suspense, useState, useEffect } from 'react';
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
import { SubscriptionBanner } from './components/SubscriptionBanner'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAuth } from './stores/auth'; // Added for LandingPageRouteHandler
import { AuthProvider } from './components/AuthProvider';
import { PublicRoute } from './components/PublicRoute';
import { LoadingFallback } from './components/LoadingFallback';

// Wrapper pour les composants lazy-loaded avec ErrorBoundary spécifique
const LazyComponentWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary fallback={<div className="card m-8 text-center bg-background/80 backdrop-blur-lg">
      <h2 className="text-xl font-semibold text-primary-400 mb-4">Un problème est survenu lors du chargement de cette page</h2>
      <p className="text-white/80 mb-6">Nous nous excusons pour cet inconvénient. L'équipe technique a été informée du problème.</p>
      <button 
        onClick={() => window.location.reload()}
        className="btn-primary"
      >
        Essayer de recharger
      </button>
    </div>}>
      <Suspense fallback={<LoadingFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// Handler for the landing page route - Always show landing page
const LandingPageRouteHandler = () => {
  return <LazyComponentWrapper><JobNexAILanding /></LazyComponentWrapper>; 
};

// Handler for dashboard redirect (for authenticated users)
const DashboardRedirectHandler = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback message="Vérification de la session..." />;
  }

  if (user) {
    return <Navigate to="/app/dashboard" state={{ from: location }} replace />;
  }

  return <Navigate to="/" replace />;
};

// Code splitting (React.lazy) pour les pages principales
const JobNexAILanding = React.lazy(() => import('./pages/LandingPage'));
const Auth = React.lazy(() => import('./components/Auth'));
const SupabaseAuth = React.lazy(() => import('./components/SupabaseAuth')); // Nouveau composant d'auth avec Supabase
const Pricing = React.lazy(() => import('./pages/PricingPage')); 
const PrivacyPolicy = React.lazy(() => import('./components/PrivacyPolicy'));
const FeaturesPage = React.lazy(() => import('./components/pages/FeaturesPage'));
const HowItWorksPage = React.lazy(() => import('./components/pages/HowItWorksPage'));
const TestimonialsPage = React.lazy(() => import('./components/pages/TestimonialsPage'));
const TestAuth = React.lazy(() => import('./pages/TestAuth')); // Notre nouvelle page de test pour Supabase Auth
const DebugEnv = React.lazy(() => import('./pages/DebugEnv')); // Page de débogage pour l'environnement
const DiagnosticSupabase = React.lazy(() => import('./pages/DiagnosticSupabase')); // Outil de diagnostic pour Supabase
const TestDirectSupabase = React.lazy(() => import('./pages/TestDirectSupabase')); // Test direct de Supabase avec fetch et ping
const NewSupabaseTest = React.lazy(() => import('./pages/NewSupabaseTest')); // Nouvelle page de test avec valeurs codées en dur
const AuthTest = React.lazy(() => import('./pages/AuthTest')); // Test spécifique pour l'authentification Supabase
const CVBucketTest = React.lazy(() => import('./components/CVBucketTest')); // Test spécifique pour le bucket CVs

const AboutPage = React.lazy(() => import('./components/pages/AboutPage'));
const ContactPage = React.lazy(() => import('./components/pages/ContactPage'));
const TermsPage = React.lazy(() => import('./components/pages/TermsPage'));
const ResetPassword = React.lazy(() => import('./components/ResetPassword'));
const AuthCallback = React.lazy(() => import('./components/AuthCallback'));
const StripeCheckoutStatus = React.lazy(() => import('./components/StripeCheckoutStatus'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Admin = React.lazy(() => import('./components/Admin').then(module => ({ default: module.Admin })));
const Profile = React.lazy(() => import('./components/Profile'));
const Billing = React.lazy(() => import('./components/Billing'));
const JobSearch = React.lazy(() => import('./components/JobSearch'));
const JobApplications = React.lazy(() => import('./components/JobApplications'));
const MarketAnalysis = React.lazy(() => import('./components/MarketAnalysis'));
const CVBuilder = React.lazy(() => import('./components/cv/CVBuilder'));
const UserCoverLetters = React.lazy(() => import('./components/letters/UserCoverLetters'));
const CoverLetterGenerator = React.lazy(() => import('./components/CoverLetterGenerator'));
const Settings = React.lazy(() => import('./components/Settings').then(module => ({ default: module.Settings }))); // AJOUTÉ POUR LA PAGE SETTINGS
const NetworkPage = React.lazy(() => import('./components/NetworkPage'));
const MarketTrendsPage = React.lazy(() => import('./components/pages/MarketTrendsPage'));
const WebScrapingManager = React.lazy(() => import('./components/WebScrapingManager'));
const FreelanceProjects = React.lazy(() => import('./components/freelance/FreelanceProjects'));
const FreelanceProfile = React.lazy(() => import('./components/freelance/FreelanceProfile'));
const RecruiterDashboard = React.lazy(() => import('./components/recruiter/RecruiterDashboard'));
const CandidateSearch = React.lazy(() => import('./components/recruiter/CandidateSearch'));
const JobPostings = React.lazy(() => import('./components/recruiter/JobPostings'));
const CreateJobPosting = React.lazy(() => import('./components/recruiter/CreateJobPosting'));
const UserTypeSelection = React.lazy(() => import('./components/UserTypeSelection'));
const ModernComponentsDemo = React.lazy(() => import('./components/ModernComponentsDemo').then(module => ({ default: module.ModernComponentsDemo })));

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
      <I18nextProvider i18n={i18n}>
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
            <Routes>
              <Route path="/" element={<LandingPageRouteHandler />} />
              <Route path="/home" element={<LandingPageRouteHandler />} />
              <Route path="/login" element={<PublicRoute><LazyComponentWrapper><SupabaseAuth /></LazyComponentWrapper></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><LazyComponentWrapper><SupabaseAuth /></LazyComponentWrapper></PublicRoute>} />
              <Route path="/pricing" element={<LazyComponentWrapper><Pricing /></LazyComponentWrapper>} />
              <Route path="/demo" element={<LazyComponentWrapper><ModernComponentsDemo /></LazyComponentWrapper>} />
              <Route path="/privacy" element={<LazyComponentWrapper><PrivacyPolicy /></LazyComponentWrapper>} />
              <Route path="/about" element={<LazyComponentWrapper><AboutPage /></LazyComponentWrapper>} />
              <Route path="/contact" element={<LazyComponentWrapper><ContactPage /></LazyComponentWrapper>} />
              <Route path="/terms" element={<LazyComponentWrapper><TermsPage /></LazyComponentWrapper>} />
              <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />
              <Route path="/test-auth" element={<LazyComponentWrapper><TestAuth /></LazyComponentWrapper>} />
              <Route path="/auth-supabase" element={<LazyComponentWrapper><SupabaseAuth /></LazyComponentWrapper>} />
              <Route path="/debug-env" element={<LazyComponentWrapper><DebugEnv /></LazyComponentWrapper>} />
              <Route path="/diagnostic" element={<LazyComponentWrapper><DiagnosticSupabase /></LazyComponentWrapper>} />
              <Route path="/test-direct" element={<LazyComponentWrapper><TestDirectSupabase /></LazyComponentWrapper>} />
              <Route path="/new-test" element={<LazyComponentWrapper><NewSupabaseTest /></LazyComponentWrapper>} />
              <Route path="/auth-test" element={<LazyComponentWrapper><AuthTest /></LazyComponentWrapper>} />
              <Route path="/cv-bucket-test" element={<LazyComponentWrapper><CVBucketTest /></LazyComponentWrapper>} />

              <Route path="/features" element={<LazyComponentWrapper><FeaturesPage /></LazyComponentWrapper>} />
              <Route path="/how-it-works" element={<LazyComponentWrapper><HowItWorksPage /></LazyComponentWrapper>} />
              <Route path="/testimonials" element={<LazyComponentWrapper><TestimonialsPage /></LazyComponentWrapper>} />
              <Route path="/auth/reset-password" element={<LazyComponentWrapper><ResetPassword /></LazyComponentWrapper>} />
              <Route path="/auth/callback" element={<LazyComponentWrapper><AuthCallback /></LazyComponentWrapper>} />
              <Route path="/checkout/success" element={<LazyComponentWrapper><StripeCheckoutStatus /></LazyComponentWrapper>} />
               {/* Redirection de l'ancienne route dashboard vers la nouvelle */}
               <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
               <Route path="/letters" element={<Navigate to="/app/letters" replace />} />
               {/* --- Routes Protégées --- */}
              {/* Toutes les routes ici nécessitent que l'utilisateur soit connecté */}
              <Route 
                path="/app" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                {/* Redirection de la racine protégée vers le dashboard */}
                <Route index element={<Navigate to="/app/dashboard" replace />} /> 

                {/* Routes générales du dashboard */}
                <Route path="dashboard" element={<LazyComponentWrapper><Dashboard /></LazyComponentWrapper>} />
                <Route path="profile" element={<LazyComponentWrapper><Profile /></LazyComponentWrapper>} />
                <Route path="letters" element={<LazyComponentWrapper><UserCoverLetters /></LazyComponentWrapper>} />
                <Route path="cover-letter-generator" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><CoverLetterGenerator /></LazyComponentWrapper></ProtectedRoute>} />
                <Route path="billing" element={<LazyComponentWrapper><Billing /></LazyComponentWrapper>} />
                <Route path="settings" element={<LazyComponentWrapper><Settings /></LazyComponentWrapper>} />
                <Route path="admin" element={<LazyComponentWrapper><Admin /></LazyComponentWrapper>} />
                
                {/* Routes temporairement LIBRES - Abonnement désactivé pour debug */}
                <Route path="jobs" element={<ProtectedRoute><LazyComponentWrapper><JobSearch /></LazyComponentWrapper></ProtectedRoute>} />
                <Route path="job-search" element={<ProtectedRoute><LazyComponentWrapper><JobSearch /></LazyComponentWrapper></ProtectedRoute>} />
                <Route path="modern-components-demo" element={<LazyComponentWrapper><ModernComponentsDemo /></LazyComponentWrapper>} />
                <Route path="suivi" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><JobApplications /></LazyComponentWrapper></ProtectedRoute>} />
                <Route path="market-analysis" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><MarketAnalysis /></LazyComponentWrapper></ProtectedRoute>} />
                <Route path="cv-builder" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><CVBuilder /></LazyComponentWrapper></ProtectedRoute>} />
                <Route path="network" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><NetworkPage /></LazyComponentWrapper></ProtectedRoute>} />
                <Route path="market-trends" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><MarketTrendsPage /></LazyComponentWrapper></ProtectedRoute>} />
                <Route path="web-scraping" element={<ProtectedRoute><LazyComponentWrapper><WebScrapingManager /></LazyComponentWrapper></ProtectedRoute>} />

                {/* Routes Freelance (avec abonnement) */}
                <Route path="freelance/projects" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><FreelanceProjects /></LazyComponentWrapper></ProtectedRoute>} />
                <Route path="freelance/profile" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><FreelanceProfile /></LazyComponentWrapper></ProtectedRoute>} />

                {/* Routes Recruteur (avec abonnement) */}
                <Route path="recruiter/dashboard" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><RecruiterDashboard /></LazyComponentWrapper></ProtectedRoute>} />
                <Route path="recruiter/candidates" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><CandidateSearch /></LazyComponentWrapper></ProtectedRoute>} />
                <Route path="recruiter/job-postings" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><JobPostings /></LazyComponentWrapper></ProtectedRoute>} />
                <Route path="recruiter/create-job" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><CreateJobPosting /></LazyComponentWrapper></ProtectedRoute>} />

                {/* L'ancienne route /user-type est maintenant gérée par la logique de redirection interne */}
                <Route path="user-type" element={<Navigate to="/app/dashboard" replace />} />
              </Route>
            </Routes>
            <PrivacyConsent />
            <SecurityBadge />
            {location.pathname !== '/pricing' && <SubscriptionBanner />}
            <ToastContainer />
          </Router>
        </AuthProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}

export default App;
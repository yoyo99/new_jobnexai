import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { LoadingSpinner } from './components/LoadingSpinner'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider } from './components/AuthProvider'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PrivacyConsent } from './components/PrivacyConsent'
import { SecurityBadge } from './components/SecurityBadge'
import { SubscriptionBanner } from './components/SubscriptionBanner'

import { PWAInstall, ConnectionStatus, UpdateNotification } from './src/components/PWAInstall'

// Critical components - loaded immediately
import { LandingPage } from './components/LandingPage'
import { Auth } from './components/Auth'
import { DashboardLayout } from './components/DashboardLayout'
import { Dashboard } from './components/Dashboard'

// Lazy loaded components - loaded on demand
const JobSearch = React.lazy(() => import('./components/JobSearch').then(module => ({ default: module.JobSearch })))
const MarketAnalysis = React.lazy(() => import('./components/MarketAnalysis').then(module => ({ default: module.MarketAnalysis })))
const JobApplications = React.lazy(() => import('./components/JobApplications').then(module => ({ default: module.JobApplications })))
const CVBuilder = React.lazy(() => import('./components/cv/CVBuilder').then(module => ({ default: module.CVBuilder })))
const Profile = React.lazy(() => import('./components/Profile').then(module => ({ default: module.Profile })))
const Billing = React.lazy(() => import('./components/Billing').then(module => ({ default: module.Billing })))
const NetworkPage = React.lazy(() => import('./components/NetworkPage').then(module => ({ default: module.NetworkPage })))
const MarketTrendsPage = React.lazy(() => import('./components/MarketTrendsPage').then(module => ({ default: module.MarketTrendsPage })))

// Freelance components
const FreelanceProjects = React.lazy(() => import('./components/freelance/FreelanceProjects').then(module => ({ default: module.FreelanceProjects })))
const FreelanceProfile = React.lazy(() => import('./components/freelance/FreelanceProfile').then(module => ({ default: module.FreelanceProfile })))

// Recruiter components
const RecruiterDashboard = React.lazy(() => import('./components/recruiter/RecruiterDashboard').then(module => ({ default: module.RecruiterDashboard })))
const CandidateSearch = React.lazy(() => import('./components/recruiter/CandidateSearch').then(module => ({ default: module.CandidateSearch })))
const JobPostings = React.lazy(() => import('./components/recruiter/JobPostings').then(module => ({ default: module.JobPostings })))
const CreateJobPosting = React.lazy(() => import('./components/recruiter/CreateJobPosting').then(module => ({ default: module.CreateJobPosting })))

// Application components
const CoverLetterGenerator = React.lazy(() => import('./components/applications/CoverLetterGenerator').then(module => ({ default: module.CoverLetterGenerator })))
const UserCoverLetters = React.lazy(() => import('./src/components/letters/UserCoverLetters'))

// Utility components
const WebScrapingManager = React.lazy(() => import('./src/components/WebScrapingManager'))
const UserTypeSelection = React.lazy(() => import('./components/UserTypeSelection').then(module => ({ default: module.UserTypeSelection })))

// Static pages
const Pricing = React.lazy(() => import('./components/Pricing'))
const PrivacyPolicy = React.lazy(() => import('./components/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })))
const FeaturesPage = React.lazy(() => import('./components/pages/FeaturesPage').then(module => ({ default: module.FeaturesPage })))
const HowItWorksPage = React.lazy(() => import('./components/pages/HowItWorksPage').then(module => ({ default: module.HowItWorksPage })))
const TestimonialsPage = React.lazy(() => import('./components/pages/TestimonialsPage').then(module => ({ default: module.TestimonialsPage })))
const ResetPassword = React.lazy(() => import('./components/ResetPassword').then(module => ({ default: module.ResetPassword })))
const AuthCallback = React.lazy(() => import('./components/AuthCallback').then(module => ({ default: module.AuthCallback })))
const StripeCheckoutStatus = React.lazy(() => import('./components/StripeCheckoutStatus').then(module => ({ default: module.StripeCheckoutStatus })))

// Loading fallback component
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <LoadingSpinner 
      size="lg" 
      text="Loading..." 
      className="text-primary-600"
    />
  </div>
)

// Component loading fallback
const ComponentLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner 
      size="md" 
      text="Loading component..." 
      className="text-primary-600"
    />
  </div>
)

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <Router>
          <AuthProvider>
            {/* PWA Components */}
            <PWAInstall variant="banner" />
            <ConnectionStatus />
            <UpdateNotification />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/pricing" element={
              <Suspense fallback={<PageLoadingFallback />}>
                <Pricing />
              </Suspense>
            } />
            <Route path="/privacy" element={
              <Suspense fallback={<PageLoadingFallback />}>
                <PrivacyPolicy />
              </Suspense>
            } />
            <Route path="/features" element={
              <Suspense fallback={<PageLoadingFallback />}>
                <FeaturesPage />
              </Suspense>
            } />
            <Route path="/how-it-works" element={
              <Suspense fallback={<PageLoadingFallback />}>
                <HowItWorksPage />
              </Suspense>
            } />
            <Route path="/testimonials" element={
              <Suspense fallback={<PageLoadingFallback />}>
                <TestimonialsPage />
              </Suspense>
            } />
            <Route path="/auth/reset-password" element={
              <Suspense fallback={<PageLoadingFallback />}>
                <ResetPassword />
              </Suspense>
            } />
            <Route path="/auth/callback" element={
              <Suspense fallback={<PageLoadingFallback />}>
                <AuthCallback />
              </Suspense>
            } />
            <Route path="/checkout/success" element={
              <Suspense fallback={<PageLoadingFallback />}>
                <StripeCheckoutStatus />
              </Suspense>
            } />
            <Route path="/user-type" element={
              <ProtectedRoute>
                <Suspense fallback={<ComponentLoadingFallback />}>
                  <UserTypeSelection />
                </Suspense>
              </ProtectedRoute>
            } />
            {/* Redirections des anciens chemins vers /app/* */}
            <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
            <Route path="/billing" element={<Navigate to="/app/billing" replace />} />
            <Route path="/jobs" element={<Navigate to="/app/jobs" replace />} />
            <Route path="/applications" element={<Navigate to="/app/applications" replace />} />
            <Route path="/letters" element={<Navigate to="/app/letters" replace />} />
            <Route path="/market-analysis" element={<Navigate to="/app/market-analysis" replace />} />
            <Route path="/cv-builder" element={<Navigate to="/app/cv-builder" replace />} />
            <Route path="/network" element={<Navigate to="/app/network" replace />} />
            <Route path="/market-trends" element={<Navigate to="/app/market-trends" replace />} />
            <Route path="/freelance/projects" element={<Navigate to="/app/freelance/projects" replace />} />
            <Route path="/freelance/profile" element={<Navigate to="/app/freelance/profile" replace />} />
            <Route path="/recruiter/dashboard" element={<Navigate to="/app/recruiter/dashboard" replace />} />
            <Route path="/recruiter/candidates" element={<Navigate to="/app/recruiter/candidates" replace />} />
            <Route path="/recruiter/job-postings" element={<Navigate to="/app/recruiter/job-postings" replace />} />
            <Route path="/recruiter/create-job" element={<Navigate to="/app/recruiter/create-job" replace />} />

            <Route path="/app" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={
                <Suspense fallback={<ComponentLoadingFallback />}>
                  <Profile />
                </Suspense>
              } />
              <Route path="billing" element={
                <Suspense fallback={<ComponentLoadingFallback />}>
                  <Billing />
                </Suspense>
              } />
              <Route path="jobs" element={
                <ProtectedRoute requiresSubscription>
                  <Suspense fallback={<ComponentLoadingFallback />}>
                    <JobSearch />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="jobs-search" element={
                <ProtectedRoute requiresSubscription>
                  <Suspense fallback={<ComponentLoadingFallback />}>
                    <JobSearch />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="applications" element={
                <ProtectedRoute requiresSubscription>
                  <Suspense fallback={<ComponentLoadingFallback />}>
                    <JobApplications />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="letters" element={
                <Suspense fallback={<ComponentLoadingFallback />}>
                  <UserCoverLetters />
                </Suspense>
              } />
              <Route path="cover-letter-generator" element={
                <ProtectedRoute requiresSubscription>
                  <Suspense fallback={<ComponentLoadingFallback />}>
                    <CoverLetterGenerator />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="market-analysis" element={
                <ProtectedRoute requiresSubscription>
                  <Suspense fallback={<ComponentLoadingFallback />}>
                    <MarketAnalysis />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="cv-builder" element={
                <ProtectedRoute requiresSubscription>
                  <Suspense fallback={<ComponentLoadingFallback />}>
                    <CVBuilder />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="network" element={
                <ProtectedRoute requiresSubscription>
                  <Suspense fallback={<ComponentLoadingFallback />}>
                    <NetworkPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="market-trends" element={
                <ProtectedRoute requiresSubscription>
                  <Suspense fallback={<ComponentLoadingFallback />}>
                    <MarketTrendsPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              {/* Routes pour les freelances */}
              <Route path="freelance/projects" element={
                <ProtectedRoute requiresSubscription>
                  <Suspense fallback={<ComponentLoadingFallback />}>
                    <FreelanceProjects />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="freelance/profile" element={
                <ProtectedRoute requiresSubscription>
                  <Suspense fallback={<ComponentLoadingFallback />}>
                    <FreelanceProfile />
                  </Suspense>
                </ProtectedRoute>
              } />
              {/* Routes pour les recruteurs */}
              <Route path="recruiter/dashboard" element={
                <ProtectedRoute requiresSubscription>
                  <Suspense fallback={<ComponentLoadingFallback />}>
                    <RecruiterDashboard />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="recruiter/candidates" element={
                <ProtectedRoute requiresSubscription>
                  <Suspense fallback={<ComponentLoadingFallback />}>
                    <CandidateSearch />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="recruiter/job-postings" element={
                <ProtectedRoute requiresSubscription>
                  <Suspense fallback={<ComponentLoadingFallback />}>
                    <JobPostings />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="recruiter/create-job" element={
                <ProtectedRoute requiresSubscription>
                  <Suspense fallback={<ComponentLoadingFallback />}>
                    <CreateJobPosting />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="web-scraping" element={
                <ProtectedRoute requiresSubscription>
                  <Suspense fallback={<ComponentLoadingFallback />}>
                    <WebScrapingManager />
                  </Suspense>
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
          <PrivacyConsent />
          <SecurityBadge />
          <SubscriptionBanner />
          </AuthProvider>
        </Router>
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

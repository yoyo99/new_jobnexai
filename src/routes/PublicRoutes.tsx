import React, { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PublicRoute } from "../components/PublicRoute";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { LoadingFallback } from "../components/LoadingFallback";

// Wrapper pour les composants lazy-loaded avec ErrorBoundary spécifique
const LazyComponentWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="card m-8 text-center bg-background/80 backdrop-blur-lg">
          <h2 className="text-xl font-semibold text-primary-400 mb-4">
            Un problème est survenu lors du chargement de cette page
          </h2>
          <p className="text-white/80 mb-6">
            Nous nous excusons pour cet inconvénient. L'équipe technique a été
            informée du problème.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Essayer de recharger
          </button>
        </div>
      }
    >
      <Suspense fallback={<LoadingFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// Définitions des composants lazy-loadés pour les routes publiques
const JobNexAILanding = React.lazy(() => import("../pages/LandingPage"));
const SupabaseAuth = React.lazy(() => import("../components/SupabaseAuth-NEW"));
const Pricing = React.lazy(() => import("../pages/PricingPage"));
const PrivacyPolicy = React.lazy(() => import("../components/PrivacyPolicy"));
const FeaturesPage = React.lazy(() =>
  import("../components/pages/FeaturesPage")
);
const HowItWorksPage = React.lazy(() =>
  import("../components/pages/HowItWorksPage")
);
const TestimonialsPage = React.lazy(() =>
  import("../components/pages/TestimonialsPage")
);
const AboutPage = React.lazy(() => import("../components/pages/AboutPage"));
const ContactPage = React.lazy(() => import("../components/pages/ContactPage"));
const TermsPage = React.lazy(() => import("../components/pages/TermsPage"));
const ResetPassword = React.lazy(() => import("../components/ResetPassword"));
const AuthCallback = React.lazy(() => import("../components/AuthCallback"));
const StripeCheckoutStatus = React.lazy(() =>
  import("../components/StripeCheckoutStatus")
);
const ModernComponentsDemo = React.lazy(() =>
  import("../components/ModernComponentsDemo").then((m) => ({
    default: m.ModernComponentsDemo,
  }))
);

// Handler for the landing page route
const LandingPageRouteHandler = () => {
  return (
    <LazyComponentWrapper>
      <JobNexAILanding />
    </LazyComponentWrapper>
  );
};

export const PublicRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPageRouteHandler />} />
      <Route path="/home" element={<LandingPageRouteHandler />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LazyComponentWrapper>
              <SupabaseAuth />
            </LazyComponentWrapper>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <LazyComponentWrapper>
              <SupabaseAuth />
            </LazyComponentWrapper>
          </PublicRoute>
        }
      />
      <Route
        path="/pricing"
        element={
          <LazyComponentWrapper>
            <Pricing />
          </LazyComponentWrapper>
        }
      />
      <Route
        path="/demo"
        element={
          <LazyComponentWrapper>
            <ModernComponentsDemo />
          </LazyComponentWrapper>
        }
      />
      <Route
        path="/privacy"
        element={
          <LazyComponentWrapper>
            <PrivacyPolicy />
          </LazyComponentWrapper>
        }
      />
      <Route
        path="/about"
        element={
          <LazyComponentWrapper>
            <AboutPage />
          </LazyComponentWrapper>
        }
      />
      <Route
        path="/contact"
        element={
          <LazyComponentWrapper>
            <ContactPage />
          </LazyComponentWrapper>
        }
      />
      <Route
        path="/terms"
        element={
          <LazyComponentWrapper>
            <TermsPage />
          </LazyComponentWrapper>
        }
      />
      <Route
        path="/terms-of-service"
        element={<Navigate to="/terms" replace />}
      />
      <Route
        path="/features"
        element={
          <LazyComponentWrapper>
            <FeaturesPage />
          </LazyComponentWrapper>
        }
      />
      <Route
        path="/how-it-works"
        element={
          <LazyComponentWrapper>
            <HowItWorksPage />
          </LazyComponentWrapper>
        }
      />
      <Route
        path="/testimonials"
        element={
          <LazyComponentWrapper>
            <TestimonialsPage />
          </LazyComponentWrapper>
        }
      />
      <Route
        path="/auth/reset-password"
        element={
          <LazyComponentWrapper>
            <ResetPassword />
          </LazyComponentWrapper>
        }
      />
      <Route
        path="/auth/callback"
        element={
          <LazyComponentWrapper>
            <AuthCallback />
          </LazyComponentWrapper>
        }
      />
      <Route
        path="/checkout/success"
        element={
          <LazyComponentWrapper>
            <StripeCheckoutStatus />
          </LazyComponentWrapper>
        }
      />
      {/* Redirection de l'ancienne route dashboard vers la nouvelle */}
      <Route
        path="/dashboard"
        element={<Navigate to="/app/dashboard" replace />}
      />
    </Routes>
  );
};

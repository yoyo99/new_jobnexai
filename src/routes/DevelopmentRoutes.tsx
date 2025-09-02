import React from 'react';
import { Route } from 'react-router-dom';
// Wrapper pour les composants lazy-loaded avec ErrorBoundary spécifique
const LazyComponentWrapper = ({ children }: { children: React.ReactNode }) => {
  const ErrorBoundary = React.lazy(() => import('../components/ErrorBoundary').then(m => ({ default: m.ErrorBoundary })));
  const LoadingFallback = React.lazy(() => import('../components/LoadingFallback').then(m => ({ default: m.LoadingFallback })));
  
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
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
        <React.Suspense fallback={<LoadingFallback />}>
          {children}
        </React.Suspense>
      </ErrorBoundary>
    </React.Suspense>
  );
};

// Development/Test pages lazy imports
const TestAuth = React.lazy(() => import('../pages/TestAuth'));
const DebugEnv = React.lazy(() => import('../pages/DebugEnv'));
const DiagnosticSupabase = React.lazy(() => import('../pages/DiagnosticSupabase'));
const TestDirectSupabase = React.lazy(() => import('../pages/TestDirectSupabase'));
const NewSupabaseTest = React.lazy(() => import('../pages/NewSupabaseTest'));
const AuthTest = React.lazy(() => import('../pages/AuthTest'));
const CVBucketTest = React.lazy(() => import('../components/CVBucketTest'));
const SupabaseAuth = React.lazy(() => import('../components/SupabaseAuth'));

export const DevelopmentRoutes = () => {
  // Only render development routes in development environment
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <Route path="/test-auth" element={<LazyComponentWrapper><TestAuth /></LazyComponentWrapper>} />
      <Route path="/auth-supabase" element={<LazyComponentWrapper><SupabaseAuth /></LazyComponentWrapper>} />
      <Route path="/debug-env" element={<LazyComponentWrapper><DebugEnv /></LazyComponentWrapper>} />
      <Route path="/diagnostic" element={<LazyComponentWrapper><DiagnosticSupabase /></LazyComponentWrapper>} />
      <Route path="/test-direct" element={<LazyComponentWrapper><TestDirectSupabase /></LazyComponentWrapper>} />
      <Route path="/new-test" element={<LazyComponentWrapper><NewSupabaseTest /></LazyComponentWrapper>} />
      <Route path="/auth-test" element={<LazyComponentWrapper><AuthTest /></LazyComponentWrapper>} />
      <Route path="/cv-bucket-test" element={<LazyComponentWrapper><CVBucketTest /></LazyComponentWrapper>} />
    </>
  );
};

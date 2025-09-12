import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './components/AuthProvider';
import { PrivacyConsent } from './components/PrivacyConsent';
import { SecurityBadge } from './components/SecurityBadge';
import { SubscriptionBanner } from './components/SubscriptionBanner';
import { LoadingSpinner } from './components/LoadingSpinner';
// ... autres imports nécessaires

const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Profile = React.lazy(() => import('./components/Profile'));
// ... autres lazy


const ComponentLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner size="md" text="Loading component..." className="text-primary-600" />
  </div>
);

function LazyComponentWrapper(props: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ComponentLoadingFallback />}>
      {props.children}
    </Suspense>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<LazyComponentWrapper><Dashboard /></LazyComponentWrapper>} />
              <Route path="/profile" element={<LazyComponentWrapper><Profile /></LazyComponentWrapper>} />
              {/* ... autres routes */}
            </Routes>
            <PrivacyConsent />
            <SecurityBadge />
            <SubscriptionBanner />
          </AuthProvider>
        </Router>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
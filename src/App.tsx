import React, { Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { SubscriptionProvider } from "./components/SubscriptionManager";
import { LoadingFallback } from "./components/LoadingFallback";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PublicRoutes } from "./routes/PublicRoutes";
import { AppRoutes } from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import { useTranslations } from "./i18n";
import "./index.css";

// Composant pour gérer les redirections basées sur l'état d'authentification
const AuthRedirectHandler = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { t } = useTranslations();

  if (loading) {
    return <LoadingFallback />;
  }

  // Si l'utilisateur est connecté et sur une page publique (sauf certaines exceptions), rediriger vers le dashboard
  const publicPaths = [
    "/",
    "/login",
    "/register",
    "/pricing",
    "/about",
    "/features",
    "/how-it-works",
    "/testimonials",
    "/privacy",
    "/terms",
    "/contact",
    "/demo",
  ];
  const isPublicPath = publicPaths.includes(location.pathname) ||
    location.pathname.startsWith("/blog");

  if (user && isPublicPath && location.pathname !== "/app/dashboard") {
    return <Navigate to="/app/dashboard" replace />;
  }

  return null;
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen bg-background text-white font-sans antialiased">
      <AuthRedirectHandler />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Routes publiques */}
          <Route path="/*" element={<PublicRoutes />} />

          {/* Routes de l'application (protégées) */}
          <Route path="/app/*" element={<AppRoutes />} />
        </Routes>
      </Suspense>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1e293b",
            color: "#fff",
            border: "1px solid #334155",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <SubscriptionProvider>
            <AppContent />
          </SubscriptionProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;

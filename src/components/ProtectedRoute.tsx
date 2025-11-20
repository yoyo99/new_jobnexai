import * as React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../stores/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresSubscription?: boolean;
  adminOnly?: boolean;
}

export function ProtectedRoute({
  children,
  requiresSubscription = false,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { user, subscription, loading, initialized } = useAuth();
  const location = useLocation();

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400">
        </div>
      </div>
    );
  }

  if (!user) {
    if (location.pathname === '/login') {
      return <>{children}</>;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !user.is_admin) {
    return <Navigate to="/app/dashboard" replace />;
  }

  if (requiresSubscription) {
    const isTrialValid = user.trial_ends_at &&
      new Date(user.trial_ends_at) > new Date();
    const hasActiveSubscription = subscription?.status === "active" ||
      subscription?.status === "trialing";
    if (!isTrialValid && !hasActiveSubscription) {
      return <Navigate to="/pricing" state={{ from: location }} replace />;
    }
  }

  return <>{children}</>;
}

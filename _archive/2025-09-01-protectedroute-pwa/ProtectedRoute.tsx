import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../stores/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiresSubscription?: boolean
}

export function ProtectedRoute({ children, requiresSubscription = false }: ProtectedRouteProps) {
  const { user, subscription, loading, initialized } = useAuth()
  const location = useLocation()

  // Afficher un loader pendant la vérification de l'authentification
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
      </div>
    )
  }

  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Vérifier si l'utilisateur a un abonnement actif ou une période d'essai valide
  if (requiresSubscription) {
    const isTrialValid = user.trial_ends_at && new Date(user.trial_ends_at) > new Date()
    const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing'

    if (!isTrialValid && !hasActiveSubscription) {
      return <Navigate to="/pricing" state={{ from: location }} replace />
    }
  }

  return <>{children}</>
}
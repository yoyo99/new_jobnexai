import * as React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../stores/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiresSubscription?: boolean
}

export function ProtectedRoute({ children, requiresSubscription = false }: ProtectedRouteProps) {
  const { user, subscription, loading, initialized } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationAttempted = React.useRef(false);

  React.useEffect(() => {
    // Si on charge ou pas encore initialisé, on réinitialise le drapeau car l'état n'est pas stable
    if (loading || !initialized) {
      navigationAttempted.current = false;
      return;
    }

    // À ce point: loading is false, initialized is true

    if (!user) {
      if (!navigationAttempted.current && location.pathname !== '/login') {
        console.log('[ProtectedRoute] User not found. Scheduling redirect to /login ONCE.');
        navigationAttempted.current = true;
        // Le setTimeout est réintroduit ici
        setTimeout(() => {
          console.log('[ProtectedRoute] Executing scheduled redirect to /login.');
          navigate('/login', { state: { from: location }, replace: true });
        }, 0);
      }
      return; // L'utilisateur est null, pas besoin de vérifier l'abonnement
    } else {
      // L'utilisateur est chargé, on peut réinitialiser le drapeau pour de futures déconnexions
      navigationAttempted.current = false;
    }

    // Si l'utilisateur existe, vérifier l'abonnement
    if (requiresSubscription) {
      const isTrialValid = user.trial_ends_at && new Date(user.trial_ends_at) > new Date();
      const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';
      if (!isTrialValid && !hasActiveSubscription) {
        if (!navigationAttempted.current && location.pathname !== '/pricing') {
          console.log('[ProtectedRoute] Subscription invalid. Scheduling redirect to /pricing ONCE.');
          navigationAttempted.current = true;
          // Le setTimeout est réintroduit ici
          setTimeout(() => {
            console.log('[ProtectedRoute] Executing scheduled redirect to /pricing.');
            navigate('/pricing', { state: { from: location }, replace: true });
          }, 0);
        }
      } else {
        // L'abonnement est valide, on peut réinitialiser le drapeau (si on en utilisait un séparé pour /pricing)
        // Pour l'instant, le même drapeau est partagé, ce qui est ok si les conditions sont mutuellement exclusives
        // ou si on considère que toute redirection réussie réinitialise la nécessité de re-vérifier.
        // Si `user` est true, navigationAttempted est déjà false grâce au bloc précédent.
      }
    }
  }, [user, loading, initialized, subscription, requiresSubscription, navigate, location]);

  // 1. Gérer l'état de chargement initial ou le chargement en cours
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
      </div>
    );
  }

  // 2. Si le chargement est terminé et que l'application est initialisée:
  //    Vérifier si l'utilisateur existe et remplit les conditions d'abonnement.
  //    Si une redirection est nécessaire (gérée par useEffect), rendre null pour éviter d'afficher les enfants prématurément.
  if (!user) {
    // L'utilisateur n'est pas là, useEffect devrait avoir déclenché une redirection.
    // Rendre null pour attendre que la redirection prenne effet.
    return null;
  }

  if (requiresSubscription) {
    const isTrialValid = user.trial_ends_at && new Date(user.trial_ends_at) > new Date();
    const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';
    if (!isTrialValid && !hasActiveSubscription) {
      // L'abonnement est requis mais manquant/invalide, useEffect devrait avoir déclenché une redirection.
      // Rendre null pour attendre que la redirection prenne effet.
      return null;
    }
  }

  // 3. Si tous les contrôles sont passés (chargement terminé, utilisateur existe, abonnement OK),
  //    rendre les enfants du composant.
  return <>{children}</>;
}
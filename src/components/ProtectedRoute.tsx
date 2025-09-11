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
        <p className="mt-4 text-gray-400">Chargement de votre session utilisateur...</p>
      </div>
    );
  }

  // 2. Si le chargement est terminé et que l'application est initialisée:
  //    Vérifier si l'utilisateur existe et remplit les conditions d'abonnement.
  //    Si une redirection est nécessaire (gérée par useEffect), rendre null pour éviter d'afficher les enfants prématurément.
  if (!user) {
    // L'utilisateur n'est pas là, useEffect devrait avoir déclenché une redirection.
    // Afficher un message explicite si la redirection ne prend pas effet.
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center text-red-500">
        <h2 className="text-2xl font-bold mb-4">Vous devez être connecté pour accéder à cette page.</h2>
        <p>Merci de vous reconnecter ou de vérifier votre accès.</p>
        <button onClick={() => window.location.href = '/login'} className="btn-primary mt-4">Aller à la page de connexion</button>
        <div className="bg-black/60 text-xs text-left mt-8 p-4 rounded-lg max-w-xl w-full break-words text-white">
          <div><b>Debug Zustand/Supabase :</b></div>
          <div><b>loading</b>: {String(loading)}</div>
          <div><b>initialized</b>: {String(initialized)}</div>
          <div><b>error</b>: {error || 'aucune'}</div>
          <div><b>user</b>: <pre>{JSON.stringify(user, null, 2)}</pre></div>
          <div><b>subscription</b>: <pre>{JSON.stringify(subscription, null, 2)}</pre></div>
        </div>
      </div>
    );
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
  //    rendre les enfants du composant, mais capturer toute erreur critique.
  try {
    return <>{children}</>;
  } catch (err: any) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center text-red-500">
        <h2 className="text-2xl font-bold mb-4">Erreur critique dans un composant protégé</h2>
        <p>{err?.message || String(err)}</p>
        <div className="bg-black/60 text-xs text-left mt-8 p-4 rounded-lg max-w-xl w-full break-words text-white">
          <div><b>Debug Zustand/Supabase :</b></div>
          <div><b>loading</b>: {String(loading)}</div>
          <div><b>initialized</b>: {String(initialized)}</div>
          <div><b>error</b>: {error || 'aucune'}</div>
          <div><b>user</b>: <pre>{JSON.stringify(user, null, 2)}</pre></div>
          <div><b>subscription</b>: <pre>{JSON.stringify(subscription, null, 2)}</pre></div>
        </div>
      </div>
    );
  }
}
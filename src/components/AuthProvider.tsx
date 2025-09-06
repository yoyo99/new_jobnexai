import { useEffect } from 'react';
import { useAuth } from '../stores/auth';
import { getSupabase } from '../hooks/useSupabaseConfig';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  console.log('[AuthProvider] -> Le composant est en cours de rendu.');
  const initialized = useAuth(state => state.initialized);
  const loadUser = useAuth(state => state.loadUser);

  useEffect(() => {
    console.log('[AuthProvider] -> useEffect a été déclenché. Appel de loadUser...');
    // 1. Charger l'utilisateur au montage initial du composant.
    loadUser();

    // 2. S'abonner aux changements d'état d'authentification de Supabase.
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const client = getSupabase();
      const result = client.auth.onAuthStateChange((event) => {
        console.log(`AuthProvider: Événement d'authentification Supabase - ${event}`);
        // Recharger les données utilisateur à chaque événement pour garder l'état synchronisé.
        loadUser();
      });
      subscription = result.data.subscription;
    } catch (error) {
      console.error('[AuthProvider] -> Impossible d\'initialiser onAuthStateChange:', error);
      // On continue sans abonnement pour ne pas bloquer le rendu de l'application
    }

    // 3. Écouter les changements de stockage pour la synchronisation entre onglets.
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.includes('supabase.auth.token')) {
        console.log('AuthProvider: Événement de stockage détecté, rechargement des données utilisateur.');
        loadUser();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 4. Fonction de nettoyage pour se désabonner lors du démontage du composant.
    return () => {
      try {
        subscription?.unsubscribe?.();
      } catch (e) {
        console.warn('[AuthProvider] -> Erreur lors de la désinscription onAuthStateChange:', e);
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadUser]); // `loadUser` est stable, donc cet effet ne s'exécute qu'une seule fois.

  // Afficher un écran de chargement tant que l'initialisation n'est pas terminée.
  if (!initialized) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111827', color: 'white' }}>
        <p>Chargement de l'application...</p>
      </div>
    );
  }

  // Une fois l'initialisation terminée, rendre l'application.
  return <>{children}</>;
}
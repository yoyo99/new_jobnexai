import { useEffect } from 'react';
import { useAuth } from '../stores/auth';
import { getSupabase } from '../hooks/useSupabaseConfig';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initialized = useAuth(state => state.initialized);
  const loadUser = useAuth(state => state.loadUser);

  useEffect(() => {
    // 1. Charger l'utilisateur au montage initial du composant.
    loadUser();

    // 2. S'abonner aux changements d'état d'authentification de Supabase.
    const { data: { subscription } } = getSupabase().auth.onAuthStateChange((event, session) => {
      // Recharger les données utilisateur à chaque événement pour garder l'état synchronisé.
      loadUser();
    });

    // 3. Écouter les changements de stockage pour la synchronisation entre onglets.
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.includes('supabase.auth.token')) {
        loadUser();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 4. Fonction de nettoyage pour se désabonner lors du démontage du composant.
    return () => {
      subscription?.unsubscribe();
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
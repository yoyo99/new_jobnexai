import { useEffect } from 'react';
import { useAuth } from '../stores/auth';
import { getSupabase } from '../hooks/useSupabaseConfig';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  console.log('[AuthProvider] -> Le composant est en cours de rendu.');
  const initialized = useAuth(state => state.initialized);
  const error = useAuth(state => state.error);
  const loadUser = useAuth(state => state.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Écouter les changements d'état d'authentification Supabase
  useEffect(() => {
    const { data: { subscription } } = getSupabase().auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthProvider] Auth state changed:', event, session ? 'session exists' : 'no session');
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await loadUser();
        } else if (event === 'SIGNED_OUT') {
          // Clear user state when signed out
          useAuth.setState({ user: null, subscription: null });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUser]);

  // Écouter les changements de localStorage pour synchroniser entre onglets
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'supabase.auth.token') {
        loadUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadUser]);

  if (!initialized) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111827', color: 'white' }}>
        <p>Chargement de l'application...</p>
      </div>
    );
  }

  // Gestion explicite des erreurs d'authentification
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-4">Erreur d'authentification</h2>
          <p className="text-gray-300 mb-6">
            Une erreur est survenue lors de la vérification de votre session : {error}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                useAuth.setState({ error: null });
                loadUser();
              }}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Réessayer
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Aller à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Une fois l'initialisation terminée, rendre l'application.
  return <>{children}</>;
}
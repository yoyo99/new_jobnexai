import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../stores/auth';

export default function AuthCallback() {
  const router = useRouter();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Récupération de la session après le callback Google
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          // Mise à jour du store d'authentification
          setUser(session.user);

          // Création/mise à jour de l'utilisateur dans la base de données
          const { error: dbError } = await supabase
            .from('users')
            .upsert({
              id: session.user.id,
              email: session.user.email,
              display_name: session.user.user_metadata?.full_name,
              avatar_url: session.user.user_metadata?.avatar_url,
              auth_provider: 'google',
              last_login: new Date().toISOString()
            });

          if (dbError) console.error('DB error:', dbError);

          // Redirection vers le tableau de bord
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        router.push('/login?error=auth_failed');
      }
    };

    handleAuthCallback();
  }, [router, setUser]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-400 mx-auto"></div>
        <p className="mt-4 text-gray-600">Finalisation de la connexion...</p>
      </div>
    </div>
  );
}
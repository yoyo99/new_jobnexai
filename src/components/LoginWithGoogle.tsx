import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { useAuth } from '../stores/auth';

export function LoginWithGoogle() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Utilisation directe de Supabase Auth pour Google
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (authError) throw authError;

      // Si pas de redirection automatique (pour les tests)
      if (data.url) {
        window.location.href = data.url;
      }

    } catch (err) {
      console.error('Google login error:', err);
      setError(err instanceof Error ? err.message : 'Échec de la connexion avec Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
      >
        {loading ? (
          <span className="animate-spin h-5 w-5 border-2 border-gray-400 rounded-full border-t-transparent"></span>
        ) : (
          <>
            <svg className="h-5 w-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4C12.95 4 4 12.95 4 24C4 35.05 12.95 44 24 44C35.05 44 44 35.05 44 24C44 12.95 35.05 4 24 4Z" fill="#FFC107"/>
              <path d="M24 34C21.8 34 19.8 33.2 18.2 32L18.2 26L24 26L24 30.2C24 30.6 24.2 31 24.5 31.2L28.5 33.6C27.6 34.4 26.5 35 24 35C20.4 35 17.2 32.8 15.6 29.6L18.8 26.8C20.2 28.8 22.2 30 24 30C25.8 30 27.4 28.8 28.4 27.2L31.2 30C29.8 31.6 27.8 32.8 24 32.8C19 32.8 14.8 28.8 13.2 23.2L17.8 20.4C19.4 24 22.2 26.8 26 26.8L26 22L21.8 22C20.2 22 19 21.2 18.2 20L24 15.2C25.8 16.8 28 19 28 22C28 23.2 27.8 24.2 27.2 25L34.4 19.6C32 16.8 28.4 14.8 24 14.8C18.4 14.8 13.6 18.8 11.2 24L15.6 28.8C18 25.6 21.2 23.6 24 23.6C26.8 23.6 29.2 25.2 30.4 27.6L36.8 22C35.2 18.8 32 16.4 28 15.2L24 19.2C22.2 17.6 20 16.8 17.8 16.8C14.4 16.8 11.2 19.6 10 23.2L14.4 27.2C16.8 24 20.4 22 24 22Z" fill="#FF3D00"/>
              <path d="M24 24C24 23.4 24.1 22.8 24.2 22.2H18V26H24C23.4 27.4 22.4 28.6 21.2 29.4L24 32.2C24.8 31.4 25.8 30.4 26.6 29.4L29.4 32.2C28.2 33.4 26.6 34.2 24 34C20.4 34 17.2 31.8 15.6 28.8L18.8 26C20.2 28 22.2 29.2 24 29.2C25.8 29.2 27.4 28 28.4 26.4L31.2 29.2C29.8 30.8 27.8 31.8 24 31.8C19 31.8 14.8 27.8 13.2 22.2L17.8 19.4C19.4 23 22.2 25.8 26 25.8L26 21L21.8 21C20.2 21 19 20.2 18.2 19L24 15.2C25.8 16.8 28 19 28 22C28 23.2 27.8 24.2 27.2 25L34.4 19.6C32 16.8 28.4 14.8 24 14.8C18.4 14.8 13.6 18.8 11.2 24L15.6 28.8C18 25.6 21.2 23.6 24 23.6C26.8 23.6 29.2 25.2 30.4 27.6L36.8 22C35.2 18.8 32 16.4 28 15.2L24 19.2C22.2 17.6 20 16.8 17.8 16.8C14.4 16.8 11.2 19.6 10 23.2L14.4 27.2C16.8 24 20.4 22 24 22Z" fill="#4CAF50"/>
              <path d="M24 24C24 23.4 24.1 22.8 24.2 22.2H18V26H24C23.4 27.4 22.4 28.6 21.2 29.4L24 32.2C24.8 31.4 25.8 30.4 26.6 29.4L29.4 32.2C28.2 33.4 26.6 34.2 24 34C20.4 34 17.2 31.8 15.6 28.8L18.8 26C20.2 28 22.2 29.2 24 29.2C25.8 29.2 27.4 28 28.4 26.4L31.2 29.2C29.8 30.8 27.8 31.8 24 31.8C19 31.8 14.8 27.8 13.2 22.2L17.8 19.4C19.4 23 22.2 25.8 26 25.8L26 21L21.8 21C20.2 21 19 20.2 18.2 19L24 15.2C25.8 16.8 28 19 28 22C28 23.2 27.8 24.2 27.2 25L34.4 19.6C32 16.8 28.4 14.8 24 14.8C18.4 14.8 13.6 18.8 11.2 24L15.6 28.8C18 25.6 21.2 23.6 24 23.6C26.8 23.6 29.2 25.2 30.4 27.6L36.8 22C35.2 18.8 32 16.4 28 15.2L24 19.2C22.2 17.6 20 16.8 17.8 16.8C14.4 16.8 11.2 19.6 10 23.2L14.4 27.2C16.8 24 20.4 22 24 22Z" fill="#1976D2"/>
            </svg>
            <span>Continuer avec Google</span>
          </>
        )}
      </Button>

      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}
    </div>
  );
}
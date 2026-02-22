import { useState } from 'react';
import { LoginWithGoogle } from './LoginWithGoogle';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../stores/auth';
import { supabase } from '../lib/supabase';

export function AuthFormWithGoogle() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Connexion avec email/mot de passe
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;
        
        if (data.user) {
          setUser(data.user);
          window.location.href = '/dashboard';
        }
      } else {
        // Inscription avec email/mot de passe
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
            },
          },
        });

        if (authError) throw authError;
        
        if (data.user) {
          setUser(data.user);
          window.location.href = '/dashboard';
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'Échec de l\'authentification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">
          {isLogin ? 'Se connecter' : 'Créer un compte'}
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          {isLogin ? 'Accédez à votre espace JobNexAI' : 'Rejoignez la plateforme'}
        </p>
      </div>

      {/* Bouton Google en premier */}
      <div className="space-y-4">
        <LoginWithGoogle />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-gray-400">
              ou avec email
            </span>
          </div>
        </div>
      </div>

      {/* Formulaire email/mot de passe */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Adresse email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
            Mot de passe
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
          />
        </div>

        {error && (
          <div className="text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <span className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent mx-auto"></span>
            ) : (
              isLogin ? 'Se connecter' : "S'inscrire"
            )}
          </Button>
        </div>
      </form>

      <div className="text-center text-sm text-gray-400">
        {isLogin ? (
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className="hover:text-white transition-colors"
          >
            Pas encore de compte ? S'inscrire
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className="hover:text-white transition-colors"
          >
            Déjà un compte ? Se connecter
          </button>
        )}
      </div>
    </div>
  );
}
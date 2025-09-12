import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { useJobnexai } from '../hooks/useJobnexai';

const SupabaseAuth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Détecter automatiquement si on est sur la page d'inscription
  const [isLogin, setIsLogin] = useState(() => location.pathname !== '/register');

  // Utiliser notre nouveau hook au lieu du AuthService
  const { auth, isLoggedIn, user } = useJobnexai();

  // Récupérer l'URL de redirection si elle existe
  const from = location.state?.from?.pathname || '/app/dashboard';

  // Mettre à jour le mode selon la route
  useEffect(() => {
    setIsLogin(location.pathname !== '/register');
  }, [location.pathname]);

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    if (isLoggedIn && user) {
      navigate('/app/dashboard');
    }
  }, [isLoggedIn, user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    setTermsError(null);
    if (!acceptTerms) {
      setTermsError(t('auth.errors.acceptTerms'));
      return;
    }
    e.preventDefault();
    setMessage(null);
    if (!email || !password) {
      setMessage({ type: 'error', text: t('auth.errors.requiredFields') });
      return;
    }
    if (password.length < 9) {
      setMessage({ type: 'error', text: t('auth.errors.passwordLength') });
      return;
    }
    try {
      setLoading(true);
      // Utiliser notre hook auth.register à la place de AuthService.signUp
      // Diviser le nom complet en prénom et nom pour correspondre à l'interface attendue
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const { data: user, error } = await auth.register(email, password, { firstName, lastName });
      
      if (error) {
        setMessage({ type: 'error', text: error.message });
        return;
      }
      if (!user) {
        setMessage({ type: 'error', text: t('auth.errors.signup') });
        return;
      }
      setMessage({ type: 'success', text: t('auth.success.signup') });
      // Délai pour lire le message, puis la navigation dans son propre tick
      setTimeout(() => {
        setTimeout(() => {
          navigate('/pricing');
        }, 0);
      }, 2000);
    } catch (error: any) {
      console.error('Error signing up:', error);
      setMessage({ type: 'error', text: error?.message || t('auth.errors.unknown') });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setShowHelp(false);
    if (!email || !password) {
      setMessage({ type: 'error', text: t('auth.errors.requiredFields') });
      return;
    }
    if (password.length < 9) {
      setMessage({ type: 'error', text: t('auth.errors.passwordLength') });
      return;
    }
    try {
      setLoading(true);
      // Utiliser notre hook auth.login à la place de AuthService.signIn
      const { data: user, error } = await auth.login(email, password);
      
      if (error) {
        // Mapping des messages d'erreur Supabase vers des clés i18n si possible
        let errorKey = '';
        if (error.message === 'Invalid login credentials') errorKey = 'auth.errors.login';
        if (error.message === 'User already registered') errorKey = 'auth.errors.signup';
        if (error.message === 'Password should be at least 9 characters') errorKey = 'auth.errors.passwordLength';
        setMessage({ type: 'error', text: errorKey !== '' ? t(errorKey) : error.message || t('auth.errors.unknown') });
        setShowHelp(true);
        return;
      }
      if (!user) {
        setMessage({ type: 'error', text: t('auth.errors.login') });
        setShowHelp(true);
        return;
      }
      setMessage({ type: 'success', text: t('auth.success.login') });
      // Délai pour lire le message, puis la navigation
      setTimeout(() => {
        navigate(from);
      }, 1500);
    } catch (error: any) {
      console.error('Error signing in:', error);
      setMessage({ type: 'error', text: error?.message || t('auth.errors.unknown') });
      setShowHelp(true);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage({ type: 'error', text: t('auth.errors.emailRequired') });
      return;
    }
    try {
      setLoading(true);
      // Utiliser notre hook auth.resetPassword à la place de AuthService.resetPassword
      const { error } = await auth.resetPassword(email);
      
      if (error) {
        setMessage({ type: 'error', text: error.message });
        return;
      }
      setMessage({ type: 'success', text: t('auth.success.passwordReset') });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setMessage({ type: 'error', text: error?.message || t('auth.errors.unknown') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth-gradient py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-background/80 backdrop-blur-md p-8 rounded-xl shadow-xl border border-white/10"
      >
        <div>
          <img
            className="mx-auto h-20 w-auto"
            src="/logo.png"
            alt="JobNexAI"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {isLogin ? t('auth.title.login') : t('auth.title.signup')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            {isLogin ? t('auth.subtitle.login') : t('auth.subtitle.signup')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={isLogin ? handleSignIn : handleSignUp}>
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                {t('auth.email')}
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setMessage(null);
                }}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-400 text-white rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white/5"
                placeholder={t('auth.email')}
              />
            </div>
            {!isLogin && (
              <div>
                <label htmlFor="full-name" className="sr-only">
                  {t('auth.fullName')}
                </label>
                <input
                  id="full-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required={!isLogin}
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setMessage(null);
                  }}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-400 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white/5"
                  placeholder={t('auth.fullName')}
                />
              </div>
            )}
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                minLength={9}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setMessage(null);
                }}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-400 text-white rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white/5 pr-10"
                placeholder={t('auth.password')}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-primary-400 focus:outline-none"
                style={{ background: 'none', border: 'none' }}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          
          {/* Terms checkbox for signup */}
          {!isLogin && (
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (e.target.checked) setTermsError(null);
                  }}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-white/30 rounded bg-white/5"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="font-medium text-gray-300">
                  {t('auth.acceptTerms', 'J\'accepte les')} {' '}
                  <a href="/terms" className="text-primary-400 hover:text-primary-300">
                    {t('auth.termsLink', 'conditions d\'utilisation')}
                  </a>
                </label>
                {termsError && <p className="mt-1 text-sm text-red-400">{termsError}</p>}
              </div>
            </div>
          )}
          
          {/* Forgot Password Link */}
          {isLogin && (
            <div className="flex justify-end text-sm mt-2 mb-4">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="font-medium text-primary-400 hover:text-primary-300 focus:outline-none underline"
              >
                {t('auth.forgotPasswordLink', 'Mot de passe oublié ?')}
              </button>
            </div>
          )}
          {!isLogin && <PasswordStrengthMeter password={password} />}
          {message && (
            <div
              className={`rounded-md p-4 ${
                message.type === 'error' ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'
              }`}
              role="alert"
            >
              <p className="text-sm">{message.text}</p>
            </div>
          )}
          {showHelp && isLogin && (
            <div className="bg-blue-900/50 text-blue-400 p-4 rounded-md">
              <h4 className="text-sm font-medium mb-2">{t('auth.help.title')}</h4>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>{t('auth.help.checkEmail')}</li>
                <li>{t('auth.help.capsLock')}</li>
                <li>{t('auth.help.forgotPassword')}</li>
                <li>{t('auth.help.noAccount')}</li>
              </ul>
            </div>
          )}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : isLogin ? t('auth.login') : t('auth.createAccount')}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage(null);
                setShowHelp(false);
              }}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white btn-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isLogin ? t('auth.createAccount') : t('auth.alreadyRegistered')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SupabaseAuth;

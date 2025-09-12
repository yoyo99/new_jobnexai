import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { useJobnexai } from '../hooks/useJobnexai';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
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

  const { auth, isLoggedIn, user } = useJobnexai();

  // Récupérer l'URL de redirection si elle existe
  const from = location.state?.from?.pathname || '/app/dashboard';



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
            const { data: user, error } = await auth.register(email, password, { 
        firstName: fullName.split(' ')[0] || '', 
        lastName: fullName.split(' ').slice(1).join(' ') || '' 
      });
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
            const { data: user, error } = await auth.login(email, password);
      if (error) {
        // Mapping des messages d’erreur Supabase vers des clés i18n si possible
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
      console.log(`[Auth.tsx] handleSignIn: Preparing to navigate. 'from' is: ${from}`);
      setTimeout(() => {
        console.log(`[Auth.tsx] handleSignIn: Executing navigate(${from}) inside setTimeout.`);
        navigate(from);
      }, 0);
    } catch (error: any) {
      // Mapping des messages d’erreur JS génériques
      let errorKey = '';
      if (error?.message === 'Invalid login credentials') errorKey = 'auth.errors.login';
      if (error?.message === 'User already registered') errorKey = 'auth.errors.signup';
      if (error?.message === 'Password should be at least 9 characters') errorKey = 'auth.errors.passwordLength';
      setMessage({ type: 'error', text: errorKey !== '' ? t(errorKey) : error?.message || t('auth.errors.unknown') });
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
            const { error } = await auth.resetPassword(email);
      if (error) {
        setMessage({ type: 'error', text: error.message });
        return;
      }
      setMessage({ type: 'success', text: t('auth.success.reset') });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || t('auth.errors.unknown') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {isLogin ? t('auth.login') : t('auth.signup')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            {t('common.or')}{' '}
            <a href="/pricing" className="font-medium text-primary-400 hover:text-primary-300">
              {t('auth.startTrial')}
            </a>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={isLogin ? handleSignIn : handleSignUp}>
          {/* Ajout de la case à cocher pour les CGU */}
          {!isLogin && (
            <div className="flex items-center mb-2">
              <input
                id="accept-terms"
                name="acceptTerms"
                type="checkbox"
                checked={acceptTerms}
                onChange={e => setAcceptTerms(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded"
                required
              />
              <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-300">
                {t('auth.acceptTerms')}{' '}
                <a href="/cgu" target="_blank" rel="noopener noreferrer" className="underline text-primary-400 hover:text-primary-300">
                  {t('auth.termsLink')}
                </a>
              </label>
            </div>
          )}
          {termsError && (
            <div className="bg-red-900/50 text-red-400 p-2 rounded mb-2 text-sm">{termsError}</div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
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
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setMessage(null);
                  }}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-400 text-white rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white/5"
                  placeholder={t('auth.fullName')}
                />
              </div>
            )}
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
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-400 text-white ${isLogin && !fullName ? 'rounded-t-md' : ''} focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white/5`}
                placeholder={t('auth.email')}
              />
            </div>
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
          {/* Forgot Password Link */}
          {isLogin && (
            <div className="flex justify-end text-sm mt-2 mb-4"> {/* Ajout d'un peu d'espace vertical */}
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

export default Auth;
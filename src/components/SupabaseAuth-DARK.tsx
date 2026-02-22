import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, UserIcon, EnvelopeIcon, LockClosedIcon, SparklesIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { useJobnexai } from '../hooks/useJobnexai';

const SupabaseAuth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Détecter automatiquement si on est sur la page d'inscription
  const [isLogin, setIsLogin] = useState(() => location.pathname !== '/register');

  // Utiliser notre nouveau hook au lieu du AuthService
  const { auth } = useJobnexai();

  // Récupérer l'URL de redirection si elle existe
  const from = location.state?.from?.pathname || '/app/dashboard';

  const handleSignIn = async (e: React.FormEvent) => {
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
      const { data: user, error } = await auth.login(email, password);
      
      if (error) {
        let errorKey = '';
        if (error.message === 'Invalid login credentials') errorKey = 'auth.errors.login';
        if (error.message === 'User already registered') errorKey = 'auth.errors.signup';
        if (error.message === 'Password should be at least 9 characters') errorKey = 'auth.errors.passwordLength';
        setMessage({ type: 'error', text: errorKey !== '' ? t(errorKey) : error.message || t('auth.errors.unknown') });
        return;
      }
      if (!user) {
        setMessage({ type: 'error', text: t('auth.errors.login') });
        return;
      }
      setMessage({ type: 'success', text: t('auth.success.login') });
      setTimeout(() => {
        setTimeout(() => {
          navigate(from);
        }, 2000);
      }, 1500);
    } catch (error: any) {
      console.error('Error signing in:', error);
      setMessage({ type: 'error', text: error?.message || t('auth.errors.unknown') });
    } finally {
      setLoading(false);
    }
  };

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
      setTimeout(() => {
        setTimeout(() => {
          navigate(from);
        }, 2000);
      }, 1500);
    } catch (error: any) {
      console.error('Error signing up:', error);
      setMessage({ type: 'error', text: error?.message || t('auth.errors.unknown') });
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
      setMessage({ type: 'success', text: t('auth.success.passwordReset') });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setMessage({ type: 'error', text: error?.message || t('auth.errors.unknown') });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      const { error } = await auth.signInWithGoogle();
      
      if (error) {
        setMessage({ type: 'error', text: error.message });
        return;
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      setMessage({ type: 'error', text: error?.message || t('auth.errors.unknown') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full bg-grid-pattern"></div>
        </div>
      </div>
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-500 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full max-w-2xl"
      >
        {/* Header with AI branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <CpuChipIcon className="w-10 h-10 text-white" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 border-2 border-blue-500/30 rounded-2xl"
              />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {isLogin ? 'Welcome Back' : 'Join the Revolution'}
          </h1>
          
          <p className="text-xl text-gray-400 mb-2">
            {isLogin ? 'Access your AI-powered career platform' : 'Start your intelligent job search journey'}
          </p>
          
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <SparklesIcon className="w-4 h-4" />
            <span>Powered by Advanced AI</span>
            <SparklesIcon className="w-4 h-4" />
          </div>
        </motion.div>

        {/* Main auth card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-800 p-8 shadow-2xl"
        >
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">10K+</div>
              <div className="text-xs text-gray-500">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">95%</div>
              <div className="text-xs text-gray-500">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-400">24/7</div>
              <div className="text-xs text-gray-500">AI Support</div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={isLogin ? handleSignIn : handleSignUp}>
            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setMessage(null);
                  }}
                  className="block w-full pl-10 pr-3 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  placeholder="you@example.com"
                />
              </div>
            </motion.div>

            {/* Name Field for Signup */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setMessage(null);
                    }}
                    className="block w-full pl-10 pr-3 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    placeholder="John Doe"
                  />
                </div>
              </motion.div>
            )}

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setMessage(null);
                  }}
                  className="block w-full pl-10 pr-12 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-blue-400 focus:outline-none transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Terms for Signup */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
              >
                <div className="flex items-start">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => {
                      setAcceptTerms(e.target.checked);
                      if (e.target.checked) setTermsError(null);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded mt-1 bg-gray-800"
                  />
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="text-gray-400">
                      I agree to the{' '}
                      <a href="/terms" className="text-blue-400 hover:text-blue-300 font-medium">
                        Terms of Service
                      </a>
                    </label>
                    {termsError && <p className="mt-1 text-sm text-red-400">{termsError}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Forgot Password Link */}
            {isLogin && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-right"
              >
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                >
                  Forgot password?
                </button>
              </motion.div>
            )}

            {!isLogin && <PasswordStrengthMeter password={password} />}

            {/* Message Display */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`rounded-xl p-4 ${
                    message.type === 'error' 
                      ? 'bg-red-900/50 text-red-300 border border-red-800' 
                      : 'bg-green-900/50 text-green-300 border border-green-800'
                  }`}
                  role="alert"
                >
                  <p className="text-sm font-medium">{message.text}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8 8 8 0 008 0z"></path>
                  </svg>
                  {isLogin ? 'Accessing...' : 'Creating...'}
                </span>
              ) : (
                <span>{isLogin ? 'Access Dashboard' : 'Create Account'}</span>
              )}
            </motion.button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-900 text-gray-500">OR CONTINUE WITH</span>
              </div>
            </div>

            {/* Google Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-gray-800 border border-gray-700 text-gray-300 font-medium py-4 px-4 rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </span>
            </motion.button>

            {/* Toggle Auth */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-center pt-6 border-t border-gray-800"
            >
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage(null);
                }}
                className="text-sm text-gray-400 hover:text-white font-medium transition-colors"
              >
                {isLogin ? (
                  <>
                    New to the platform?{' '}
                    <span className="text-blue-400 hover:text-blue-300">Sign up</span>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <span className="text-blue-400 hover:text-blue-300">Sign in</span>
                  </>
                )}
              </button>
            </motion.div>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center mt-8 text-sm text-gray-500"
        >
          <p>Join 10,000+ professionals using AI to accelerate their careers</p>
        </motion.div>
      </motion.div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .bg-grid-pattern {
            background-image: 
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
            background-size: 50px 50px;
          }
        `
      }} />
    </div>
  );
};

export default SupabaseAuth;

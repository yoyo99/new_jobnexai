import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, UserIcon, EnvelopeIcon, LockClosedIcon, SparklesIcon, DocumentTextIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { useJobnexai } from '../hooks/useJobnexai';

const SupabaseAuth: React.FC = () => {
  console.log('🔥 NEW BALANCED DESIGN LOADED v2.0');
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full bg-grid-pattern"></div>
        </div>
      </div>

      {/* Main container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 z-10"
      >
        {/* Left side - Features */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:w-1/2 space-y-8"
        >
          {/* Logo and branding */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center justify-center lg:justify-start mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <BriefcaseIcon className="w-6 h-6 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold text-gray-900">JobNexAI</span>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {isLogin ? 'Welcome Back' : 'Start Your Journey'}
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              {isLogin 
                ? 'Access your AI-powered career platform' 
                : 'Get hired 80% faster with AI-powered job applications'
              }
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Resume Builder</h3>
              <p className="text-sm text-gray-600">Create optimized resumes that get past ATS systems</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <SparklesIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Auto Apply</h3>
              <p className="text-sm text-gray-600">Apply to hundreds of jobs with one click</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BriefcaseIcon className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Interview Practice</h3>
              <p className="text-sm text-gray-600">AI-powered mock interviews with real feedback</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <EnvelopeIcon className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Cover Letters</h3>
              <p className="text-sm text-gray-600">Personalized cover letters in seconds</p>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl text-white">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">1.2M+</div>
                <div className="text-sm opacity-90">Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold">80%</div>
                <div className="text-sm opacity-90">Success Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-sm opacity-90">AI Support</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right side - Auth form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:w-1/2"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <form className="space-y-6" onSubmit={isLogin ? handleSignIn : handleSignUp}>
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
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
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </motion.div>

              {/* Name Field for Signup */}
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                >
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
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
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                </motion.div>
              )}

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
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
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
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
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <div className="ml-3 text-sm">
                      <label htmlFor="terms" className="text-gray-600">
                        I agree to the{' '}
                        <a href="/terms" className="text-blue-600 hover:text-blue-500 font-medium">
                          Terms of Service
                        </a>
                      </label>
                      {termsError && <p className="mt-1 text-sm text-red-600">{termsError}</p>}
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
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium"
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
                    className={`rounded-lg p-4 ${
                      message.type === 'error' 
                        ? 'bg-red-50 text-red-800 border border-red-200' 
                        : 'bg-green-50 text-green-800 border border-green-200'
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
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8 8 8 0 008 0z"></path>
                    </svg>
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                )}
              </motion.button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* Google Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </span>
              </motion.button>

              {/* Toggle Auth */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="text-center pt-6 border-t border-gray-200"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setMessage(null);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  {isLogin ? (
                    <>
                      New to JobNexAI?{' '}
                      <span className="text-blue-600 hover:text-blue-500">Sign up</span>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <span className="text-blue-600 hover:text-blue-500">Sign in</span>
                    </>
                  )}
                </button>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </motion.div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .bg-grid-pattern {
            background-image: linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
            background-size: 50px 50px;
          }
        `
      }} />
    </div>
  );
};

export default SupabaseAuth;

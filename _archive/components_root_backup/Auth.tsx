import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'
import { AuthService } from '../lib/auth-service'
import { supabase } from '../lib/supabase'

export function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  // Récupérer l'URL de redirection si elle existe
  const from = location.state?.from?.pathname || '/dashboard'

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkSession = async () => {
      const { session } = await AuthService.getSession()
      if (session) {
        navigate('/dashboard')
      }
    }
    
    checkSession()
  }, [navigate])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs' })
      return
    }

    try {
      setLoading(true)
      const { user, error } = await AuthService.signUp(email, password, fullName)

      if (error) {
        setMessage({ type: 'error', text: error.message })
        return
      }

      if (!user) {
        setMessage({ type: 'error', text: 'Une erreur est survenue lors de l\'inscription' })
        return
      }

      setMessage({ 
        type: 'success', 
        text: 'Inscription réussie ! Vous pouvez maintenant vous connecter.' 
      })
      
      // Rediriger vers la page de tarification après un court délai
      setTimeout(() => {
        navigate('/pricing')
      }, 2000)
    } catch (error: any) {
      console.error('Error signing up:', error)
      setMessage({ type: 'error', text: error.message || 'Une erreur est survenue' })
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setShowHelp(false)

    if (mfaRequired) {
      // Vérification du code TOTP
      if (!mfaFactorId || !mfaCode) {
        setMessage({ type: 'error', text: 'Veuillez entrer le code à 6 chiffres.' })
        return
      }
      try {
        setLoading(true)
        const { error } = await supabase.auth.mfa.verify({ factorId: mfaFactorId, code: mfaCode })
        if (error) {
          setMessage({ type: 'error', text: error.message || 'Code MFA invalide.' })
          return
        }
        setMessage({ type: 'success', text: 'Connexion MFA réussie !' })
        setMfaRequired(false)
        setMfaCode('')
        // Rediriger après MFA
        navigate(from)
      } catch (error: any) {
        setMessage({ type: 'error', text: error.message || 'Erreur MFA.' })
      } finally {
        setLoading(false)
      }
      return
    }

    if (!email || !password) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs' })
      return
    }

    try {
      setLoading(true)
      // Tentative de login classique
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        // Si MFA requis (Supabase v2)
        if (error.status === 400 && error.message?.toLowerCase().includes('mfa')) {
          // Démarrer le challenge MFA
          const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorType: 'totp' })
          if (challengeError || !challengeData) {
            setMessage({ type: 'error', text: challengeError?.message || 'Erreur MFA.' })
            return
          }
          setMfaRequired(true)
          setMfaFactorId(challengeData.id)
          setMessage({ type: 'success', text: 'Veuillez entrer le code à 6 chiffres de votre application d’authentification.' })
          return
        }
        setMessage({ type: 'error', text: error.message })
        setShowHelp(true)
        return
      }
      if (!data?.user) {
        setMessage({ type: 'error', text: 'Une erreur est survenue lors de la connexion' })
        return
      }
      setMessage({ type: 'success', text: 'Connexion réussie !' })
      navigate(from)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Une erreur est survenue' })
      setShowHelp(true)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Veuillez entrer votre adresse email' })
      return
    }

    try {
      setLoading(true)
      const { error } = await AuthService.resetPassword(email)

      if (error) {
        setMessage({ type: 'error', text: error.message })
        return
      }

      setMessage({ 
        type: 'success', 
        text: 'Instructions de réinitialisation envoyées à votre adresse email' 
      })
    } catch (error: any) {
      console.error('Error resetting password:', error)
      setMessage({ type: 'error', text: error.message || 'Une erreur est survenue' })
    } finally {
      setLoading(false)
    }
  }

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
          <div className="rounded-md shadow-sm -space-y-px">
            {!isLogin && (
              <div>
                <label htmlFor="full-name" className="sr-only">
                  Nom complet
                </label>
                <input
                  id="full-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    setMessage(null)
                  }}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-400 text-white rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white/5"
                  placeholder="Nom complet"
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
                  setEmail(e.target.value)
                  setMessage(null)
                }}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-400 text-white ${isLogin && !fullName ? 'rounded-t-md' : ''} focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white/5`}
                placeholder={t('auth.email')}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setMessage(null)
                }}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-white/10 placeholder-gray-400 text-white rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white/5"
                placeholder={t('auth.password')}
              />
            </div>
          </div>

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
              <h4 className="text-sm font-medium mb-2">Besoin d'aide pour vous connecter ?</h4>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Vérifiez que votre adresse email est correcte</li>
                <li>Assurez-vous que le verrouillage des majuscules est désactivé</li>
                <li>Si vous avez oublié votre mot de passe, utilisez le lien "Mot de passe oublié"</li>
                <li>Si vous n'avez pas encore de compte, cliquez sur "Créer un compte"</li>
              </ul>
            </div>
          )}

          {isLogin && (
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-medium text-primary-400 hover:text-primary-300"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
            </div>
          )}

          {/* Bloc MFA TOTP si requis */}
          {mfaRequired && (
            <div className="my-4">
              <label htmlFor="mfaCode" className="block text-sm font-medium text-gray-400 mb-1">
                Code à 6 chiffres (MFA)
              </label>
              <input
                id="mfaCode"
                type="text"
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-center"
                maxLength={6}
                inputMode="numeric"
                autoFocus
              />
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : isLogin ? (mfaRequired ? 'Valider le code MFA' : t('auth.login')) : t('auth.createAccount')}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setMessage(null)
                setShowHelp(false)
              }}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white btn-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isLogin ? "Créer un compte" : "Déjà inscrit ? Se connecter"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
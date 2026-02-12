import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AuthService } from '../lib/auth-service'

export function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    
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
            Mot de passe oublié
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Entrez votre adresse email pour recevoir les instructions de réinitialisation
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
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
                  setEmail(e.target.value)
                  setMessage(null)
                }}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-white/10 placeholder-gray-400 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm bg-white/5"
                placeholder={t('auth.email')}
              />
            </div>
          </div>

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

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : 'Envoyer les instructions'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white btn-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Retour à la connexion
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
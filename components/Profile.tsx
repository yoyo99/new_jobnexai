import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../stores/auth'
import { UserPreferences } from './UserPreferences'
import { UserSkills } from './UserSkills'
import { JobAlerts } from './JobAlerts'
import { useTranslation } from 'react-i18next'
import { SubscriptionManager } from './SubscriptionManager'
import { StripeWebhookInfo } from './StripeWebhookInfo'

export function Profile() {
  const { user, loadUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'skills' | 'alerts' | 'subscription' | 'webhook'>('profile')

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      setLoading(true)
      // Appel à l’API Edge Function pour valider et mettre à jour le profil
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          fullName,
          // Ajoute ici les autres champs requis (userType, legalStatus, ...)
        })
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Erreur inconnue lors de la mise à jour du profil.')
        setMessage({ type: 'error', text: data.error || t('profile.personalInfo.updateError') })
        return
      }
      await loadUser()
      setMessage({ type: 'success', text: t('profile.personalInfo.updateSuccess') })
    } catch (error: any) {
      setError(error.message || 'Erreur inconnue lors de la mise à jour du profil.')
      setMessage({ type: 'error', text: error.message || t('profile.personalInfo.updateError') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white">{t('profile.title')}</h1>
        <p className="text-gray-400 mt-1">{t('profile.subtitle')}</p>
      </motion.div>

      <div className="mb-6 border-b border-white/10">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'subscription'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Abonnement
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preferences'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Préférences
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'skills'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Compétences
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'alerts'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Alertes
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'webhook'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Webhook
          </button>
        </nav>
      </div>

      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-lg font-semibold text-white mb-6">{t('profile.personalInfo.title')}</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                {t('auth.email')}
              </label>
              <input
                type="email"
                id="email"
                value={user?.email}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white opacity-50"
              />
            </div>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-400 mb-1">
                {t('profile.personalInfo.fullName')}
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {error && (
              <div className="rounded-md p-4 bg-red-900/50 text-red-400">
                <p className="text-sm">{error}</p>
              </div>
            )}
            {message && (
              <div className={`rounded-md p-4 ${
                message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
              }`}>
                <p className="text-sm">{message.text}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? t('common.loading') : t('common.save')}
            </button>
          </form>
        </motion.div>
      )}

      {activeTab === 'subscription' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <SubscriptionManager />
        </motion.div>
      )}

      {activeTab === 'preferences' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <UserPreferences />
        </motion.div>
      )}

      {activeTab === 'skills' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <UserSkills />
        </motion.div>
      )}

      {activeTab === 'alerts' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <JobAlerts />
        </motion.div>
      )}

      {activeTab === 'webhook' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <StripeWebhookInfo />
        </motion.div>
      )}
    </div>
  )
}
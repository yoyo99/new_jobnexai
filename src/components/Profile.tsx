import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../stores/auth'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { UserPreferences } from './UserPreferences'
import { UserSkills } from './UserSkills'
import { JobAlerts } from './JobAlerts'
import { useTranslation } from 'react-i18next'
import { SubscriptionManager } from './SubscriptionManager'
import { StripeWebhookInfo } from './StripeWebhookInfo'
import UserAISettings from './UserAISettings';
import UserCVs from './UserCVs';
import CoverLetterGenerator from './CoverLetterGenerator';
import { StatusMessageType } from '../types/common';

function Profile() {
  const { user, subscription, loadUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [title, setTitle] = useState(user?.title || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [linkedin, setLinkedin] = useState(user?.linkedin || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [message, setMessage] = useState<StatusMessageType | null>(null)
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'ai' | 'skills' | 'alerts' | 'subscription' | 'webhook' | 'cvs' | 'coverLetterGenerator'>('profile')

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          title,
          phone,
          location,
          linkedin,
          website,
        })
        .eq('id', user?.id)

      if (error) throw error

      await loadUser()
      setMessage({ type: 'success', text: t('forms.changesSaved') })
    } catch (error) {
      setMessage({ type: 'error', text: t('profile.personalInfo.updateError') })
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
            onClick={() => setActiveTab('ai')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ai'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            IA
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
          <button
            onClick={() => setActiveTab('cvs')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cvs'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            {t('profile.tabs.myCVs')} 
          </button>
          <button
            onClick={() => setActiveTab('coverLetterGenerator')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'coverLetterGenerator'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            {t('profile.tabs.coverLetterGenerator')}
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
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-1">
                Titre professionnel
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-400 mb-1">
                  Localisation
                </label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="linkedin" className="block text-sm font-medium text-gray-400 mb-1">
                  LinkedIn
                </label>
                <input
                  type="url"
                  id="linkedin"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-400 mb-1">
                  Site web
                </label>
                <input
                  type="url"
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
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

      {activeTab === 'ai' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-lg font-semibold text-white mb-6">Paramètres IA</h2>
          <UserAISettings userId={user?.id} />
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

      {activeTab === 'cvs' && user?.id && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <UserCVs userId={user.id} />
        </motion.div>
      )}

      {activeTab === 'coverLetterGenerator' && user?.id && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <CoverLetterGenerator />
        </motion.div>
      )}
    </div>
  )
}

export default Profile;
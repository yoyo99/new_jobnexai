import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../stores/auth'
import { supabase } from '../lib/supabase'
import {
  BellIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  KeyIcon,
  UserIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

interface SecuritySettings {
  enable_mfa: boolean
  enable_login_notifications: boolean
  enable_suspicious_activity_alerts: boolean
}

interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  job_alerts: boolean
  message_notifications: boolean
  application_updates: boolean
}

interface PrivacySettings {
  profile_visibility: 'public' | 'connections' | 'private'
  show_online_status: boolean
  allow_messages: boolean
  allow_connection_requests: boolean
}

export function Settings() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'security' | 'notifications' | 'privacy' | 'language'>('security')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    enable_mfa: false,
    enable_login_notifications: true,
    enable_suspicious_activity_alerts: true,
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    job_alerts: true,
    message_notifications: true,
    application_updates: true,
  })

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profile_visibility: 'public',
    show_online_status: true,
    allow_messages: true,
    allow_connection_requests: true,
  })

  const saveSettings = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          security: securitySettings,
          notifications: notificationSettings,
          privacy: privacySettings,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      setMessage({ type: 'success', text: 'Paramètres mis à jour avec succès' })
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour des paramètres' })
    } finally {
      setLoading(false)
    }
  }

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-gray-400 mt-1">
          Gérez vos préférences de sécurité, de confidentialité et de notifications
        </p>
      </div>

      <div className="mb-6 border-b border-white/10">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('security')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Sécurité
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notifications'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'privacy'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Confidentialité
          </button>
          <button
            onClick={() => setActiveTab('language')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'language'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Langue
          </button>
        </nav>
      </div>

      {activeTab === 'security' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="card">
            <h2 className="text-lg font-medium text-white mb-6">
              Paramètres de sécurité
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Authentification à deux facteurs
                  </p>
                  <p className="text-sm text-gray-400">
                    Ajoutez une couche de sécurité supplémentaire à votre compte
                  </p>
                </div>
                <button
                  onClick={() => setSecuritySettings(prev => ({
                    ...prev,
                    enable_mfa: !prev.enable_mfa
                  }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    securitySettings.enable_mfa ? 'bg-primary-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      securitySettings.enable_mfa ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Notifications de connexion
                  </p>
                  <p className="text-sm text-gray-400">
                    Recevez une notification lors d'une nouvelle connexion
                  </p>
                </div>
                <button
                  onClick={() => setSecuritySettings(prev => ({
                    ...prev,
                    enable_login_notifications: !prev.enable_login_notifications
                  }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    securitySettings.enable_login_notifications ? 'bg-primary-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      securitySettings.enable_login_notifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Alertes d'activité suspecte
                  </p>
                  <p className="text-sm text-gray-400">
                    Soyez alerté en cas d'activité suspecte sur votre compte
                  </p>
                </div>
                <button
                  onClick={() => setSecuritySettings(prev => ({
                    ...prev,
                    enable_suspicious_activity_alerts: !prev.enable_suspicious_activity_alerts
                  }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    securitySettings.enable_suspicious_activity_alerts ? 'bg-primary-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      securitySettings.enable_suspicious_activity_alerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'notifications' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="card">
            <h2 className="text-lg font-medium text-white mb-6">
              Paramètres de notification
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Notifications par email
                  </p>
                  <p className="text-sm text-gray-400">
                    Recevez des notifications par email
                  </p>
                </div>
                <button
                  onClick={() => setNotificationSettings(prev => ({
                    ...prev,
                    email_notifications: !prev.email_notifications
                  }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    notificationSettings.email_notifications ? 'bg-primary-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notificationSettings.email_notifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Notifications push
                  </p>
                  <p className="text-sm text-gray-400">
                    Recevez des notifications dans votre navigateur
                  </p>
                </div>
                <button
                  onClick={() => setNotificationSettings(prev => ({
                    ...prev,
                    push_notifications: !prev.push_notifications
                  }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    notificationSettings.push_notifications ? 'bg-primary-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notificationSettings.push_notifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Alertes emploi
                  </p>
                  <p className="text-sm text-gray-400">
                    Recevez des alertes pour les nouveaux emplois correspondant à vos critères
                  </p>
                </div>
                <button
                  onClick={() => setNotificationSettings(prev => ({
                    ...prev,
                    job_alerts: !prev.job_alerts
                  }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    notificationSettings.job_alerts ? 'bg-primary-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notificationSettings.job_alerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Messages
                  </p>
                  <p className="text-sm text-gray-400">
                    Recevez des notifications pour les nouveaux messages
                  </p>
                </div>
                <button
                  onClick={() => setNotificationSettings(prev => ({
                    ...prev,
                    message_notifications: !prev.message_notifications
                  }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    notificationSettings.message_notifications ? 'bg-primary-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notificationSettings.message_notifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Mises à jour des candidatures
                  </p>
                  <p className="text-sm text-gray-400">
                    Recevez des notifications pour les mises à jour de vos candidatures
                  </p>
                </div>
                <button
                  onClick={() => setNotificationSettings(prev => ({
                    ...prev,
                    application_updates: !prev.application_updates
                  }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    notificationSettings.application_updates ? 'bg-primary-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notificationSettings.application_updates ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'privacy' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="card">
            <h2 className="text-lg font-medium text-white mb-6">
              Paramètres de confidentialité
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Visibilité du profil
                </label>
                <select
                  value={privacySettings.profile_visibility}
                  onChange={(e) => setPrivacySettings(prev => ({
                    ...prev,
                    profile_visibility: e.target.value as 'public' | 'connections' | 'private'
                  }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="public">Public</option>
                  <option value="connections">Connexions uniquement</option>
                  <option value="private">Privé</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Afficher le statut en ligne
                  </p>
                  <p className="text-sm text-gray-400">
                    Permettre aux autres utilisateurs de voir quand vous êtes en ligne
                  </p>
                </div>
                <button
                  onClick={() => setPrivacySettings(prev => ({
                    ...prev,
                    show_online_status: !prev.show_online_status
                  }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    privacySettings.show_online_status ? 'bg-primary-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0  transition duration-200 ease-in-out ${
                      privacySettings.show_online_status ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Autoriser les messages
                  </p>
                  <p className="text-sm text-gray-400">
                    Permettre aux autres utilisateurs de vous envoyer des messages
                  </p>
                </div>
                <button
                  onClick={() => setPrivacySettings(prev => ({
                    ...prev,
                    allow_messages: !prev.allow_messages
                  }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    privacySettings.allow_messages ? 'bg-primary-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      privacySettings.allow_messages ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Autoriser les demandes de connexion
                  </p>
                  <p className="text-sm text-gray-400">
                    Permettre aux autres utilisateurs de vous envoyer des demandes de connexion
                  </p>
                </div>
                <button
                  onClick={() => setPrivacySettings(prev => ({
                    ...prev,
                    allow_connection_requests: !prev.allow_connection_requests
                  }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    privacySettings.allow_connection_requests ? 'bg-primary-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      privacySettings.allow_connection_requests ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'language' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="card">
            <h2 className="text-lg font-medium text-white mb-6">
              Paramètres de langue
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => i18n.changeLanguage(language.code)}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    i18n.language === language.code
                      ? 'bg-primary-600/20'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{language.flag}</span>
                    <span className="text-white">{language.name}</span>
                  </div>
                  {i18n.language === language.code && (
                    <span className="text-primary-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {message && (
        <div className={`mt-6 rounded-md p-4 ${
          message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
        }`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <button
          onClick={saveSettings}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </button>
      </div>
    </div>
  )
}
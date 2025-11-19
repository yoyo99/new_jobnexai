import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../stores/auth'
import { motion } from 'framer-motion'

interface NotificationSettings {
  id: string
  email_notifications: boolean
  push_notifications: boolean
  in_app_notifications: boolean
  job_alerts: boolean
  connection_requests: boolean
  messages: boolean
}

export function NotificationPreferences() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      setSettings(data)
    } catch (error) {
      console.error('Error loading notification settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async () => {
    if (!settings) return

    try {
      setSaving(true)
      setMessage(null)

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user?.id,
          ...settings,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
      setMessage({ type: 'success', text: 'Préférences mises à jour avec succès' })
    } catch (error) {
      console.error('Error updating notification settings:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour des préférences' })
    } finally {
      setSaving(false)
    }
  }

  const toggleSetting = (key: keyof NotificationSettings) => {
    if (!settings) return
    setSettings(prev => prev ? {
      ...prev,
      [key]: !prev[key],
    } : null)
  }

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-white mb-4">
          Préférences de notification
        </h2>
        <p className="text-gray-400">
          Personnalisez la façon dont vous souhaitez être notifié des différents événements.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Notifications par email</p>
            <p className="text-sm text-gray-400">
              Recevez des notifications par email pour les mises à jour importantes
            </p>
          </div>
          <button
            onClick={() => toggleSetting('email_notifications')}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              settings.email_notifications ? 'bg-primary-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.email_notifications ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Notifications push</p>
            <p className="text-sm text-gray-400">
              Recevez des notifications dans votre navigateur
            </p>
          </div>
          <button
            onClick={() => toggleSetting('push_notifications')}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              settings.push_notifications ? 'bg-primary-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.push_notifications ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Notifications dans l'application</p>
            <p className="text-sm text-gray-400">
              Recevez des notifications directement dans l'application
            </p>
          </div>
          <button
            onClick={() => toggleSetting('in_app_notifications')}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              settings.in_app_notifications ? 'bg-primary-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.in_app_notifications ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Alertes emploi</p>
            <p className="text-sm text-gray-400">
              Recevez des notifications pour les nouvelles offres correspondant à vos critères
            </p>
          </div>
          <button
            onClick={() => toggleSetting('job_alerts')}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              settings.job_alerts ? 'bg-primary-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.job_alerts ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Demandes de connexion</p>
            <p className="text-sm text-gray-400">
              Recevez des notifications pour les nouvelles demandes de connexion
            </p>
          </div>
          <button
            onClick={() => toggleSetting('connection_requests')}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              settings.connection_requests ? 'bg-primary-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.connection_requests ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Messages</p>
            <p className="text-sm text-gray-400">
              Recevez des notifications pour les nouveaux messages
            </p>
          </div>
          <button
            onClick={() => toggleSetting('messages')}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              settings.messages ? 'bg-primary-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.messages ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-900/50 text-green-400'
              : 'bg-red-900/50 text-red-400'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="flex justify-end">
        <button
          onClick={updateSettings}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les préférences'}
        </button>
      </div>
    </div>
  )
}
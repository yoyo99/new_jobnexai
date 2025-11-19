import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../stores/auth'

export function PrivacyConsent() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [showConsent, setShowConsent] = useState(false)
  const [consented, setConsented] = useState(false)

  useEffect(() => {
    checkConsent()
  }, [user])

  const checkConsent = async () => {
    if (!user) return

    const { data } = await supabase
      .from('user_preferences')
      .select('gdpr_consent')
      .eq('user_id', user.id)
      .maybeSingle()

    setShowConsent(!(data?.gdpr_consent ?? false))
  }

  const handleConsent = async (accepted: boolean) => {
    if (!user) return

    try {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          gdpr_consent: accepted,
          gdpr_consent_date: new Date().toISOString(),
        })

      setConsented(accepted)
      setShowConsent(false)
    } catch (error) {
      console.error('Error saving consent:', error)
    }
  }

  if (!showConsent) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5 z-50"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="p-2 rounded-lg bg-primary-600 shadow-lg sm:p-3">
          <div className="flex items-center justify-between flex-wrap">
            <div className="w-0 flex-1 flex items-center">
              <p className="ml-3 font-medium text-white truncate">
                <span className="md:hidden">
                  {t('privacy.shortConsent')}
                </span>
                <span className="hidden md:inline">
                  {t('privacy.consent')}
                </span>
              </p>
            </div>
            <div className="mt-2 flex-shrink-0 w-full sm:mt-0 sm:w-auto">
              <div className="flex space-x-4">
                <button
                  onClick={() => handleConsent(true)}
                  className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white hover:bg-primary-50"
                >
                  {t('privacy.accept')}
                </button>
                <button
                  onClick={() => handleConsent(false)}
                  className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-400"
                >
                  {t('privacy.decline')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from './stores/auth'
import { DashboardStats } from './DashboardStats'
import { UpgradePrompt } from './UpgradePrompt'
import { PoleEmploiLetterGenerator } from './components/pole-emploi/PoleEmploiLetterGenerator'

export function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()

  useEffect(() => {
    document.title = 'Dashboard - JobNexAI'
  }, [])

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white"
        >
          {t('dashboard.welcome')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 mt-1"
        >
          Bonjour {user?.full_name || 'utilisateur'}
        </motion.p>
      </div>

      <UpgradePrompt />

      <DashboardStats />

      {user ? (
        <div className="mt-12">
          <PoleEmploiLetterGenerator />
        </div>
      ) : (
        <p className="mt-12 text-gray-400">
          Connectez-vous pour accéder au générateur de courrier Pôle Emploi.
        </p>
      )}
    </div>
  )
}
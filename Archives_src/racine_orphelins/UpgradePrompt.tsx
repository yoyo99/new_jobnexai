import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../stores/auth'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { SparklesIcon } from '@heroicons/react/24/outline'

export function UpgradePrompt() {
  const { user, subscription } = useAuth()

  // Si l'utilisateur a un abonnement actif, ne pas afficher la bannière
  if (subscription?.status === 'active') {
    return null
  }

  // Si l'utilisateur est en période d'essai, afficher le temps restant
  const isTrialActive = user?.trial_ends_at && new Date(user.trial_ends_at) > new Date()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 rounded-lg p-6 mb-8"
    >
      <div className="flex items-start gap-4">
        <div className="p-2 bg-primary-600/30 rounded-lg">
          <SparklesIcon className="h-6 w-6 text-primary-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-white">
            {isTrialActive 
              ? 'Votre période d\'essai est active' 
              : 'Débloquez toutes les fonctionnalités premium'}
          </h3>
          <p className="text-gray-300 mt-1">
            {isTrialActive 
              ? `Profitez de toutes les fonctionnalités premium jusqu'au ${format(new Date(user.trial_ends_at!), 'dd MMMM yyyy', { locale: fr })}`
              : 'Accédez à des fonctionnalités avancées pour optimiser votre recherche d\'emploi'}
          </p>
          
          <div className="mt-4">
            <Link
              to="/pricing"
              className="btn-primary inline-flex"
            >
              {isTrialActive ? 'Passer au plan Pro' : 'Voir les plans'}
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
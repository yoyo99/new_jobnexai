import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../stores/auth'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { SparklesIcon } from '@heroicons/react/24/outline'

export function SubscriptionBanner() {
  const { user, subscription } = useAuth()

  // Si l'utilisateur a un abonnement actif, ne pas afficher la bannière
  if (subscription?.status === 'active') {
    return null
  }

  // Si l'utilisateur est en période d'essai, afficher le temps restant
  const isTrialActive = user?.trial_ends_at && new Date(user.trial_ends_at) > new Date()
  
  if (!isTrialActive && subscription?.status !== 'trialing') {
    return null
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-40 max-w-md bg-gradient-to-r from-primary-600/90 to-secondary-600/90 backdrop-blur-sm rounded-lg p-4 shadow-xl"
    >
      <div className="flex items-start gap-4">
        <div className="p-2 bg-white/10 rounded-lg">
          <SparklesIcon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-white">
            {isTrialActive 
              ? 'Votre période d\'essai est active' 
              : 'Votre période d\'essai est terminée'}
          </h3>
          <p className="text-white/80 mt-1">
            {isTrialActive 
              ? `Profitez de toutes les fonctionnalités premium jusqu'au ${format(new Date(user!.trial_ends_at!), 'dd MMMM yyyy', { locale: fr })}`
              : 'Passez à un plan payant pour continuer à profiter de toutes les fonctionnalités'}
          </p>
          
          <div className="mt-4 flex justify-between items-center">
            <Link
              to="/pricing"
              className="bg-white text-primary-600 hover:bg-white/90 px-4 py-2 rounded-lg font-medium text-sm"
            >
              {isTrialActive ? 'Passer au plan Pro' : 'Voir les plans'}
            </Link>
            
            <button
              onClick={() => {
                // Masquer la bannière en utilisant localStorage
                localStorage.setItem('subscription_banner_dismissed', 'true')
                // Forcer un re-render
                window.location.reload()
              }}
              className="text-white/80 hover:text-white text-sm"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
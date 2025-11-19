import { useAuth } from '../stores/auth'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Link } from 'react-router-dom'

export function SubscriptionStatus() {
  const { user, subscription } = useAuth()

  const getStatusLabel = () => {
    if (!subscription) return 'Aucun abonnement'
    
    switch (subscription.status) {
      case 'trialing':
        return 'Période d\'essai'
      case 'active':
        return 'Actif'
      case 'canceled':
        return 'Annulé'
      case 'incomplete':
        return 'Incomplet'
      case 'incomplete_expired':
        return 'Expiré'
      case 'past_due':
        return 'Paiement en retard'
      case 'unpaid':
        return 'Impayé'
      default:
        return 'Inconnu'
    }
  }

  const getStatusColor = () => {
    if (!subscription) return 'bg-gray-600 text-gray-100'
    
    switch (subscription.status) {
      case 'trialing':
        return 'bg-blue-600/20 text-blue-400'
      case 'active':
        return 'bg-green-600/20 text-green-400'
      case 'canceled':
        return 'bg-red-600/20 text-red-400'
      case 'incomplete':
      case 'incomplete_expired':
      case 'past_due':
      case 'unpaid':
        return 'bg-yellow-600/20 text-yellow-400'
      default:
        return 'bg-gray-600/20 text-gray-400'
    }
  }

  const isTrialActive = user?.trial_ends_at && new Date(user.trial_ends_at) > new Date()

  return (
    <div className="bg-white/5 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
            <span className="text-white font-medium capitalize">
              {subscription?.plan || 'Free'}
            </span>
          </div>
          
          {isTrialActive && (
            <p className="text-sm text-gray-400 mt-1">
              Période d'essai jusqu'au {format(new Date(user.trial_ends_at), 'dd MMMM yyyy', { locale: fr })}
            </p>
          )}
          
          {subscription?.current_period_end && (
            <p className="text-sm text-gray-400 mt-1">
              Prochaine facturation le {format(new Date(subscription.current_period_end), 'dd MMMM yyyy', { locale: fr })}
            </p>
          )}
        </div>
        
        <Link to="/billing" className="text-primary-400 hover:text-primary-300 text-sm">
          Gérer
        </Link>
      </div>
    </div>
  )
}
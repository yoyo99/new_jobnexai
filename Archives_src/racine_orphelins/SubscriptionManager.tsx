import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../stores/auth'
import { StripeService } from '../lib/stripe-service'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { PaymentMethodList } from './PaymentMethodList'

export function SubscriptionManager() {
  const { user, subscription, loadUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Vérifier si l'URL contient un paramètre de session Stripe
  useEffect(() => {
    const checkStripeSession = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const sessionId = urlParams.get('session_id')
      
      if (sessionId) {
        try {
          setLoading(true)
          const { success, data, error } = await StripeService.checkSessionStatus(sessionId)
          
          if (!success || error) {
            throw new Error(error || 'Une erreur est survenue lors de la vérification de la session')
          }
          
          // Recharger les informations utilisateur
          await loadUser()
          
          setSuccess('Votre abonnement a été activé avec succès !')
          
          // Nettoyer l'URL
          window.history.replaceState({}, document.title, window.location.pathname)
        } catch (error: any) {
          setError(error.message || 'Une erreur est survenue')
        } finally {
          setLoading(false)
        }
      }
    }
    
    checkStripeSession()
  }, [])

  const handleManageSubscription = async () => {
    if (!user || !subscription?.stripe_customer_id) return
    
    try {
      setLoading(true)
      setError(null)
      
      const { success, error } = await StripeService.createPortalSession(subscription.stripe_customer_id)
      
      if (!success) {
        throw new Error(error || 'Une erreur est survenue lors de la création de la session')
      }
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const getSubscriptionStatus = () => {
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

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-white">Gestion de l'abonnement</h2>
      
      {error && (
        <div className="bg-red-900/50 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-900/50 text-green-400 p-4 rounded-lg">
          {success}
        </div>
      )}
      
      <div className="bg-white/5 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400">Statut</p>
            <p className="text-white font-medium">{getSubscriptionStatus()}</p>
          </div>
          
          {subscription && (
            <>
              <div>
                <p className="text-sm text-gray-400">Plan</p>
                <p className="text-white font-medium capitalize">{subscription.plan}</p>
              </div>
              
              {subscription.current_period_end && (
                <div>
                  <p className="text-sm text-gray-400">Prochaine facturation</p>
                  <p className="text-white font-medium">
                    {format(new Date(subscription.current_period_end), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              )}
              
              {subscription.cancel_at && (
                <div>
                  <p className="text-sm text-gray-400">Annulation prévue le</p>
                  <p className="text-white font-medium">
                    {format(new Date(subscription.cancel_at), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              )}
            </>
          )}
          
          {user?.trial_ends_at && new Date(user.trial_ends_at) > new Date() && (
            <div>
              <p className="text-sm text-gray-400">Fin de la période d'essai</p>
              <p className="text-white font-medium">
                {format(new Date(user.trial_ends_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </p>
            </div>
          )}
          
          <div className="pt-4">
            {subscription?.stripe_customer_id ? (
              <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Chargement...' : 'Gérer mon abonnement'}
              </button>
            ) : (
              <a
                href="/pricing"
                className="btn-primary block text-center w-full"
              >
                Voir les plans
              </a>
            )}
          </div>
        </div>
      </div>

      <PaymentMethodList />
    </div>
  )
}
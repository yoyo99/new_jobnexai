import { loadStripe } from '@stripe/stripe-js'
import { supabase } from './supabase'
import { trackError, trackEvent } from './monitoring'

// Initialiser Stripe
let stripePromise: Promise<any> | null = null

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!)
  }
  return stripePromise
}

export const StripeService = {
  /**
   * Crée une session de paiement Stripe Checkout
   */
  async createCheckoutSession(userId: string, priceId: string, userType: 'candidate' | 'freelancer' | 'recruiter') {
    try {
      // Récupérer la session pour obtenir le token JWT
      const sessionData = await supabase.auth.getSession();
      const accessToken = sessionData?.data?.session?.access_token;

      if (!accessToken) {
        throw new Error('Utilisateur non authentifié ou session expirée.');
      }

      // Appeler la fonction Edge pour créer une session Checkout
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          priceId, 
          userId,
          userType
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (error) throw error

      console.log('Réponse de la fonction Supabase:', data);

      const { checkoutUrl } = data

      if (!checkoutUrl) {
        throw new Error('URL de paiement non reçue.')
      }

      // Rediriger directement vers l'URL de paiement de Stripe
      window.location.href = checkoutUrl

      trackEvent('subscription.checkout.started', {
        userId,
        priceId,
        userType
      })

      return { success: true, error: null }
    } catch (error: any) {
      trackError(error, { context: 'stripe.checkout' })
      return { 
        success: false, 
        error: error.message || 'Une erreur est survenue lors de la création de la session de paiement'
      }
    }
  },

  /**
   * Crée une session de portail client Stripe
   */
  async createPortalSession(customerId: string) {
    try {
      // Appeler la fonction Edge pour créer une session de portail
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { customerId }
      })

      if (error) throw error

      // Rediriger vers le portail client
      window.location.href = data.url

      trackEvent('subscription.portal.opened', {
        customerId
      })

      return { success: true, error: null }
    } catch (error: any) {
      trackError(error, { context: 'stripe.portal' })
      return { 
        success: false, 
        error: error.message || 'Une erreur est survenue lors de la création de la session de portail'
      }
    }
  },

  /**
   * Vérifie le statut d'une session de paiement
   */
  async checkSessionStatus(sessionId: string) {
    try {
      // Récupérer la session pour obtenir le token JWT
      const sessionData = await supabase.auth.getSession();
      const accessToken = sessionData?.data?.session?.access_token;

      if (!accessToken) {
        throw new Error('Utilisateur non authentifié ou session expirée.');
      }

      const { data, error } = await supabase.functions.invoke('check-session-status', {
        body: { sessionId },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (error) throw error

      trackEvent('subscription.checkout.completed', {
        sessionId,
        status: data.status
      })

      return { success: true, data, error: null }
    } catch (error: any) {
      trackError(error, { context: 'stripe.check_session' })
      return { 
        success: false, 
        data: null,
        error: error.message || 'Une erreur est survenue lors de la vérification de la session'
      }
    }
  }
}
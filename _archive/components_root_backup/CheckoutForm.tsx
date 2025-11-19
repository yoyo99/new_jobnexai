import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { supabase } from '../lib/supabase'
import { useAuth } from '../stores/auth'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

interface CheckoutFormProps {
  priceId: string
  planName: string
  onSuccess?: () => void
  onCancel?: () => void
}

function CheckoutFormInner({ priceId, planName, onSuccess, onCancel }: CheckoutFormProps) {
  const { user, loadUser } = useAuth()
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !user) {
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) return

    try {
      setLoading(true)
      setError(null)

      // Créer une session de paiement
      const { data, error: sessionError } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          userId: user.id,
          priceId,
          planName,
        },
      })

      if (sessionError) throw sessionError
      if (!data?.clientSecret) throw new Error('Impossible de créer la session de paiement')

      // Confirmer le paiement
      const { error: stripeError } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: user.email,
          },
        },
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      // Recharger les informations utilisateur
      await loadUser()
      
      // Réinitialiser le formulaire
      cardElement.clear()
      
      // Appeler le callback de succès
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error('Error processing payment:', error)
      setError(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Carte de crédit
        </label>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={!stripe || loading}
          className="btn-primary"
        >
          {loading ? 'Traitement en cours...' : `S'abonner à ${planName}`}
        </button>
      </div>
    </form>
  )
}

export function CheckoutForm(props: CheckoutFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutFormInner {...props} />
    </Elements>
  )
}
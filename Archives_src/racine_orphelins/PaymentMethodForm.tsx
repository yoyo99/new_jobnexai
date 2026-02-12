import { useState, useEffect } from 'react'
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

interface PaymentMethodFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

function PaymentMethodFormInner({ onSuccess, onCancel }: PaymentMethodFormProps) {
  const { user } = useAuth()
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

      // Créer une méthode de paiement
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      if (!paymentMethod) {
        throw new Error('Impossible de créer la méthode de paiement')
      }

      // Enregistrer la méthode de paiement via une fonction Edge
      const { error } = await supabase.functions.invoke('attach-payment-method', {
        body: {
          userId: user.id,
          paymentMethodId: paymentMethod.id,
        },
      })

      if (error) throw error

      // Réinitialiser le formulaire
      cardElement.clear()
      
      // Appeler le callback de succès
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error('Error adding payment method:', error)
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
          {loading ? 'Traitement en cours...' : 'Ajouter la carte'}
        </button>
      </div>
    </form>
  )
}

export function PaymentMethodForm(props: PaymentMethodFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentMethodFormInner {...props} />
    </Elements>
  )
}
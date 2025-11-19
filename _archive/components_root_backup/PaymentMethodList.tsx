import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../stores/auth'
import { supabase } from '../lib/supabase'
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { PaymentMethodForm } from './PaymentMethodForm'

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  is_default: boolean
}

export function PaymentMethodList() {
  const { user } = useAuth()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    if (user) {
      loadPaymentMethods()
    }
  }, [user])

  const loadPaymentMethods = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.functions.invoke('list-payment-methods', {
        body: { userId: user?.id }
      })

      if (error) throw error
      setPaymentMethods(data || [])
    } catch (error: any) {
      console.error('Error loading payment methods:', error)
      setError(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?')) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.functions.invoke('detach-payment-method', {
        body: { 
          userId: user?.id,
          paymentMethodId 
        }
      })

      if (error) throw error
      
      // Recharger les méthodes de paiement
      await loadPaymentMethods()
    } catch (error: any) {
      console.error('Error deleting payment method:', error)
      setError(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.functions.invoke('set-default-payment-method', {
        body: { 
          userId: user?.id,
          paymentMethodId 
        }
      })

      if (error) throw error
      
      // Recharger les méthodes de paiement
      await loadPaymentMethods()
    } catch (error: any) {
      console.error('Error setting default payment method:', error)
      setError(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPaymentMethodSuccess = () => {
    setShowAddForm(false)
    loadPaymentMethods()
  }

  if (loading && paymentMethods.length === 0) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Méthodes de paiement</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-secondary flex items-center gap-2"
        >
          {showAddForm ? 'Annuler' : (
            <>
              <PlusIcon className="h-5 w-5" />
              Ajouter une carte
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {showAddForm ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white/5 rounded-lg p-6"
        >
          <PaymentMethodForm 
            onSuccess={handleAddPaymentMethodSuccess}
            onCancel={() => setShowAddForm(false)}
          />
        </motion.div>
      ) : (
        <>
          {paymentMethods.length === 0 ? (
            <div className="bg-white/5 rounded-lg p-6 text-center">
              <p className="text-gray-400">Aucune méthode de paiement enregistrée</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary mt-4"
              >
                Ajouter une carte
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="bg-white/5 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium capitalize">{method.brand}</span>
                      <span className="text-gray-400">•••• {method.last4}</span>
                      {method.is_default && (
                        <span className="bg-primary-600/20 text-primary-400 text-xs px-2 py-1 rounded-full">
                          Par défaut
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      Expire {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.is_default && (
                      <button
                        onClick={() => handleSetDefaultPaymentMethod(method.id)}
                        className="text-sm text-primary-400 hover:text-primary-300"
                        disabled={loading}
                      >
                        Définir par défaut
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePaymentMethod(method.id)}
                      className="text-gray-400 hover:text-red-400"
                      disabled={loading}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
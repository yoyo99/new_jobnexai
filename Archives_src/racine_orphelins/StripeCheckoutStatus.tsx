import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { StripeService } from '../lib/stripe-service'
import { useAuth } from '../stores/auth'
import { LoadingSpinner } from './LoadingSpinner'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export function StripeCheckoutStatus() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')
  const location = useLocation()
  const navigate = useNavigate()
  const { loadUser } = useAuth()

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Get session_id from URL
        const params = new URLSearchParams(location.search)
        const sessionId = params.get('session_id')

        if (!sessionId) {
          setStatus('error')
          setMessage('Aucun identifiant de session trouvé')
          return
        }

        // Check session status
        const { success, data, error } = await StripeService.checkSessionStatus(sessionId)

        if (!success || error) {
          setStatus('error')
          setMessage(error || 'Une erreur est survenue lors de la vérification du paiement')
          return
        }

        // Reload user data to get updated subscription
        await loadUser()

        // Set success status
        setStatus('success')
        setMessage('Votre abonnement a été activé avec succès')

        // Redirect to dashboard after a delay
        setTimeout(() => {
          navigate('/dashboard')
        }, 3000)
      } catch (error: any) {
        setStatus('error')
        setMessage(error.message || 'Une erreur est survenue lors de la vérification du paiement')
      }
    }

    checkStatus()
  }, [location, navigate, loadUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-md w-full text-center p-8"
      >
        {status === 'loading' && (
          <>
            <LoadingSpinner size="lg" className="mb-4" />
            <h2 className="text-xl font-bold text-white mb-4">
              Vérification de votre paiement
            </h2>
            <p className="text-gray-400">
              Veuillez patienter pendant que nous vérifions votre paiement...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircleIcon className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-4">
              Paiement réussi
            </h2>
            <p className="text-gray-400 mb-6">
              {message}
            </p>
            <p className="text-sm text-gray-500">
              Vous allez être redirigé vers votre tableau de bord...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-4">
              <XCircleIcon className="h-16 w-16 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-4">
              Erreur de paiement
            </h2>
            <p className="text-gray-400 mb-6">
              {message}
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="btn-primary w-full"
            >
              Retour aux tarifs
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
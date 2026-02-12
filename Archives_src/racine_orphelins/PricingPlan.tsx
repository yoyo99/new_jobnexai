import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../stores/auth'
import { StripeService } from '../lib/stripe-service'
import { useNavigate } from 'react-router-dom'

interface PricingPlanProps {
  name: string
  price: string
  priceId: string | null
  description: string
  features: string[]
  cta: string
  mostPopular?: boolean
  frequency: 'monthly' | 'yearly'
  userType: 'candidate' | 'freelancer' | 'recruiter'
}

export function PricingPlan({
  name,
  price,
  priceId,
  description,
  features,
  cta,
  mostPopular = false,
  frequency,
  userType,
}: PricingPlanProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/pricing' } })
      return
    }

    if (!priceId) {
      // Pour le plan gratuit
      navigate('/dashboard')
      return
    }

    try {
      setLoading(true)
      
      const { success, error } = await StripeService.createCheckoutSession(
        user.id,
        priceId,
        userType
      )
      
      if (!success) {
        throw new Error(error || 'Une erreur est survenue lors de la création de la session de paiement')
      }
    } catch (error: any) {
      console.error('Error subscribing:', error)
      alert(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border ${
        mostPopular 
          ? 'border-primary-400 bg-primary-900/10' 
          : 'border-white/10 bg-white/5'
      } p-8 shadow-lg`}
    >
      {mostPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-400 text-white px-4 py-1 rounded-full text-sm font-medium">
          Le plus populaire
        </div>
      )}
      
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
        <p className="text-gray-400 mb-4">{description}</p>
        <p className="text-4xl font-bold text-white mb-6">
          {frequency === 'monthly' 
            ? price 
            : name === 'Free' 
              ? '0€' 
              : `${parseFloat(price.replace('€', '')) * 0.8 * 12}€`}
          <span className="text-sm text-gray-400">
            {name !== 'Free' && `/${frequency === 'monthly' ? 'mois' : 'an'}`}
          </span>
        </p>
        
        <ul className="space-y-4 mb-8">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-gray-300">
              <CheckIcon className="h-6 w-6 flex-none text-primary-400" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full btn-primary"
        >
          {loading ? 'Chargement...' : cta}
        </button>
      </div>
    </motion.div>
  )
}
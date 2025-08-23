import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../stores/auth'
import {
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from './LoadingSpinner'

// Types for better type safety
interface Plan {
  name: string
  price: string
  priceId: string | null
  yearlyPriceId?: string
  description: string
  features: string[]
  cta: string
  mostPopular: boolean
}

interface PricingProps {
  userType?: 'candidate' | 'freelancer' | 'recruiter'
  defaultFrequency?: 'monthly' | 'yearly'
}

// Mise à jour des IDs de produits Stripe avec vos valeurs réelles
const plans: Plan[] = [
  {
    name: 'Free',
    price: '0€',
    priceId: null,
    description: 'Essayez les fonctionnalités de base gratuitement',
    features: [
      'Recherche d\'emploi basique',
      'CV builder limité',
      'Maximum 5 candidatures par mois',
      'Pas d\'accès aux analyses de marché',
      'Pas de suggestions personnalisées',
    ],
    cta: 'Commencer gratuitement',
    mostPopular: false,
  },
  {
    name: 'Pro',
    price: '9.99€',
    priceId: 'prod_S6wNQ7xaUtpmy1', // Abonnement Pro Mensuel
    yearlyPriceId: 'prod_S6wPih2AhKZEkS', // Abonnement Pro Annuel
    description: 'Tout ce dont vous avez besoin pour votre recherche d\'emploi',
    features: [
      'Recherche d\'emploi avancée avec filtres',
      'CV builder illimité avec IA',
      'Candidatures illimitées',
      'Suivi des candidatures',
      'Analyses et statistiques',
      'Suggestions d\'emploi personnalisées',
      'Alertes emploi personnalisées',
      'Réseau professionnel',
    ],
    cta: 'Commencer l\'essai gratuit',
    mostPopular: true,
  },
  {
    name: 'Enterprise',
    price: '29.99€',
    priceId: 'prod_S6wURmBdYoDuaz', // Abonnement Entreprise Mensuel
    yearlyPriceId: 'prod_S6wVXdjUcpcJ4i', // Abonnement Entreprise Annuel
    description: 'Solution complète pour les professionnels exigeants',
    features: [
      'Tout le plan Pro',
      'Support prioritaire',
      'API access',
      'Intégration ATS',
      'Formation personnalisée',
      'Analyses avancées du marché',
      'Coaching carrière personnalisé',
      'Accès anticipé aux nouvelles fonctionnalités',
    ],
    cta: 'Contacter les ventes',
    mostPopular: false,
  },
]

// Définir les plans spécifiques pour chaque type d'utilisateur
const freelancerPlans: Plan[] = [
  {
    name: 'Free',
    price: '0€',
    priceId: null,
    description: 'Pour les freelances débutants',
    features: [
      'Accès à 5 projets par mois',
      'Profil freelance basique',
      'Maximum 3 propositions par mois',
      'Pas d\'accès aux analyses de marché',
      'Pas de mise en avant du profil',
    ],
    cta: 'Commencer gratuitement',
    mostPopular: false,
  },
  {
    name: 'Pro',
    price: '14.99€',
    priceId: 'prod_S6wNQ7xaUtpmy1', // Utiliser le même ID que pour les candidats pour simplifier
    yearlyPriceId: 'prod_S6wPih2AhKZEkS',
    description: 'Pour les freelances qui veulent développer leur activité',
    features: [
      'Accès illimité aux projets',
      'Profil freelance avancé',
      'Propositions illimitées',
      'Mise en avant du profil',
      'Analyses de marché',
      'Alertes projets personnalisées',
      'Outils de gestion de projet',
      'Facturation simplifiée',
    ],
    cta: 'Commencer l\'essai gratuit',
    mostPopular: true,
  },
  {
    name: 'Business',
    price: '24.99€',
    priceId: 'prod_S6wURmBdYoDuaz', // Utiliser le même ID que pour les candidats pour simplifier
    yearlyPriceId: 'prod_S6wVXdjUcpcJ4i',
    description: 'Pour les freelances confirmés et les agences',
    features: [
      'Tout le plan Pro',
      'Visibilité premium',
      'Accès prioritaire aux nouveaux projets',
      'Outils de collaboration',
      'Gestion d\'équipe',
      'Analyses avancées',
      'Support dédié',
      'Formation et coaching',
    ],
    cta: 'Contacter les ventes',
    mostPopular: false,
  },
]

const recruiterPlans: Plan[] = [
  {
    name: 'Starter',
    price: '0€',
    priceId: null,
    description: 'Pour les petites entreprises et les startups',
    features: [
      '1 offre d\'emploi active',
      'Accès à la base de CV (limité)',
      'Pas d\'accès aux candidats premium',
      'Pas d\'outils d\'analyse',
      'Support par email uniquement',
    ],
    cta: 'Commencer gratuitement',
    mostPopular: false,
  },
  {
    name: 'Business',
    price: '49.99€',
    priceId: 'prod_S6wNQ7xaUtpmy1', // Utiliser le même ID que pour les candidats pour simplifier
    yearlyPriceId: 'prod_S6wPih2AhKZEkS',
    description: 'Pour les entreprises en croissance',
    features: [
      '5 offres d\'emploi actives',
      'Accès complet à la base de CV',
      'Recherche avancée de candidats',
      'Outils d\'analyse de base',
      'Intégration ATS',
      'Alertes candidats',
      'Support prioritaire',
      'Personnalisation de la marque employeur',
    ],
    cta: 'Commencer l\'essai gratuit',
    mostPopular: true,
  },
  {
    name: 'Enterprise',
    price: '199.99€',
    priceId: 'prod_S6wURmBdYoDuaz', // Utiliser le même ID que pour les candidats pour simplifier
    yearlyPriceId: 'prod_S6wVXdjUcpcJ4i',
    description: 'Pour les grandes entreprises et les cabinets de recrutement',
    features: [
      'Offres d\'emploi illimitées',
      'Accès VIP à tous les candidats',
      'Outils d\'analyse avancés',
      'Intégration complète',
      'API dédiée',
      'Gestion multi-utilisateurs',
      'Account manager dédié',
      'Formation et support premium',
    ],
    cta: 'Contacter les ventes',
    mostPopular: false,
  },
]

export default function Pricing({ 
  userType: initialUserType = 'candidate',
  defaultFrequency = 'monthly'
}: PricingProps = {}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>(defaultFrequency)
  const [userType, setUserType] = useState<'candidate' | 'freelancer' | 'recruiter'>(initialUserType)
  
  // Get current subscription status
  useEffect(() => {
    const getCurrentPlan = async () => {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('plan')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()
        
        if (data && !error) {
          setCurrentPlan(data.plan)
        }
      } catch (err) {
        console.error('Error fetching current plan:', err)
      }
    }
    
    getCurrentPlan()
  }, [user])
  
  // Sélectionner les plans en fonction du type d'utilisateur
  const selectedPlans = userType === 'freelancer' 
    ? freelancerPlans 
    : userType === 'recruiter' 
      ? recruiterPlans 
      : plans

  const handleSubscribe = async (planName: string, priceId: string | null) => {
    if (!user) {
      navigate('/login', { state: { from: '/pricing' } })
      return
    }

    if (!priceId) {
      // Plan gratuit
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: frequency === 'yearly' && selectedPlans.find(p => p.name === planName)?.yearlyPriceId 
            ? selectedPlans.find(p => p.name === planName)?.yearlyPriceId
            : priceId,
          successUrl: `${window.location.origin}/app/dashboard`,
          cancelUrl: `${window.location.origin}/pricing`,
        },
      })

      if (error) throw error

      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Error creating checkout session:', err)
      setError('Une erreur est survenue lors de la création de la session de paiement')
    } finally {
      setLoading(false)
    }
  }

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'candidate':
        return <UserIcon className="h-6 w-6" />
      case 'freelancer':
        return <BriefcaseIcon className="h-6 w-6" />
      case 'recruiter':
        return <DocumentTextIcon className="h-6 w-6" />
      default:
        return <UserIcon className="h-6 w-6" />
    }
  }

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'candidate':
        return 'Candidat'
      case 'freelancer':
        return 'Freelance'
      case 'recruiter':
        return 'Recruteur'
      default:
        return 'Candidat'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Traitement en cours..." />
      </div>
    )
  }

  return (
    <div className="bg-white py-12 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choisissez le plan qui vous convient
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Démarrez gratuitement et passez à un plan premium quand vous êtes prêt.
          </p>
        </div>

        {/* User Type Selection */}
        <div className="mt-12 flex justify-center">
          <div className="flex rounded-lg bg-gray-100 p-1">
            {['candidate', 'freelancer', 'recruiter'].map((type) => (
              <button
                key={type}
                onClick={() => setUserType(type as any)}
                className={`flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  userType === type
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {getUserTypeIcon(type)}
                <span>{getUserTypeLabel(type)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Frequency Toggle */}
        <div className="mt-8 flex justify-center">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setFrequency('monthly')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                frequency === 'monthly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setFrequency('yearly')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                frequency === 'yearly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annuel
              <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-600">
                -20%
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-auto mt-8 max-w-md rounded-md bg-red-50 p-4">
            <div className="flex">
              <XMarkIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-6 lg:max-w-none lg:grid-cols-3">
          {selectedPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl border p-8 shadow-sm ${
                plan.mostPopular
                  ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.mostPopular && (
                <span className="absolute -top-5 left-0 right-0 mx-auto w-fit rounded-full bg-indigo-600 px-3 py-2 text-sm font-medium text-white">
                  Le plus populaire
                </span>
              )}
              
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                {currentPlan === plan.name.toLowerCase() && (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    Actuel
                  </span>
                )}
              </div>
              
              <p className="mt-4 text-sm text-gray-600">{plan.description}</p>
              
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">
                  {frequency === 'yearly' && plan.name !== 'Free'
                    ? `${parseFloat(plan.price.replace('€', '')) * 0.8}€`
                    : plan.price}
                </span>
                {plan.name !== 'Free' && (
                  <span className="text-sm font-semibold leading-6 text-gray-600">
                    /{frequency === 'yearly' ? 'an' : 'mois'}
                  </span>
                )}
              </p>
              
              <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon className="h-6 w-5 flex-none text-indigo-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleSubscribe(plan.name, plan.priceId)}
                disabled={loading || currentPlan === plan.name.toLowerCase()}
                className={`mt-8 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold shadow-sm transition-all ${
                  plan.mostPopular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600'
                    : 'bg-white text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300'
                } ${
                  (loading || currentPlan === plan.name.toLowerCase())
                    ? 'cursor-not-allowed opacity-50'
                    : ''
                }`}
              >
                {currentPlan === plan.name.toLowerCase()
                  ? 'Plan actuel'
                  : plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* FAQ or additional info */}
        <div className="mx-auto mt-16 max-w-2xl text-center">
          <p className="text-sm text-gray-600">
            Besoin d'aide pour choisir ? {' '}
            <a href="/contact" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Contactez notre équipe
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

// Named export for compatibility
export { Pricing }
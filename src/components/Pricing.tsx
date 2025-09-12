import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../stores/auth'
import { ContactSalesModal } from './ContactSalesModal'
import {
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

// Mise à jour des IDs de produits Stripe avec vos valeurs réelles
const plans = [
  {
    name: 'Free',
    price: 0,
    priceId: null,
    description: "Essayez gratuitement toutes les fonctionnalités de base pendant 24h !",
    features: [
      "Durée de l'offre : 24h",
      "Recherche d'emploi basique",
      'CV builder limité',
      'Maximum 5 candidatures par mois',
      "Pas d'accès aux analyses de marché",
      'Pas de suggestions personnalisées',
    ],
    cta: "Commencer l’essai gratuit de 24h", 
    mostPopular: false,
  },
  {
    name: 'Pro',
    price: 9.99,
    yearlyPrice: 95.99, // exemple : 9.99 * 12 * 0.8 (20% de réduction)
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
    cta: "S’abonner",
    mostPopular: true,
  },
  {
    name: 'Enterprise',
    price: 29.99,
    yearlyPrice: 287.90, // exemple : 29.99 * 12 * 0.8
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
const freelancerPlans = [
  {
    name: 'Free',
    price: 0,
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
    price: 14.99,
    yearlyPrice: 143.90,
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
    cta: "S’abonner",
    mostPopular: true,
  },
  {
    name: 'Business',
    price: 24.99,
    yearlyPrice: 239.90,
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

const recruiterPlans = [
  {
    name: 'Starter',
    price: 0,
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
    price: 49.99,
    yearlyPrice: 479.90,
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
    cta: "S’abonner",
    mostPopular: true,
  },
  {
    name: 'Enterprise',
    price: 199.99,
    yearlyPrice: 1919.90,
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

import { formatPrice } from '../utils/formatPrice'

function Pricing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly')
  const [userType, setUserType] = useState<'candidate' | 'freelancer' | 'recruiter'>('candidate')
  const [showContactModal, setShowContactModal] = useState(false)
  const [freeTrialUsed, setFreeTrialUsed] = useState<boolean>(false);

  // Vérification si l'utilisateur a déjà utilisé l'offre gratuite
  React.useEffect(() => {
    async function ensureFreeTrialFieldAndFetch() {
      if (!user) return;
      let fieldExists = true;
      // Vérifier si la colonne existe
      const { data: columns, error: columnError } = await supabase.rpc('pg_get_columns', { table_name: 'profiles' });
      if (columnError || !columns) {
        fieldExists = false;
      } else if (!columns.some((col: any) => col.column_name === 'free_trial_used')) {
        fieldExists = false;
      }
      // Ajouter la colonne si besoin
      if (!fieldExists) {
        const { error: alterError } = await supabase.rpc('run_sql', { sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS free_trial_used boolean DEFAULT false;` });
        if (alterError) {
          setError("Impossible d'ajouter le champ free_trial_used dans Supabase : " + alterError.message);
          return;
        }
      }
      // Ensuite, récupération normale
      const { data, error } = await supabase
        .from('profiles')
        .select('free_trial_used')
        .eq('id', user.id)
        .single();
      if (data && data.free_trial_used) setFreeTrialUsed(true);
    }
    ensureFreeTrialFieldAndFetch();
  }, [user]);

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
      // Pour le plan gratuit - ne pas griser le bouton
      try {
        setLoading(true)
        setError(null)

        // Mettre à jour le type d'utilisateur si ce n'est pas déjà fait
        if (!user.user_type) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ user_type: userType })
            .eq('id', user.id)

          if (updateError) throw updateError
        }

        // Rediriger vers la page appropriée en fonction du type d'utilisateur
        if (userType === 'freelancer') {
          navigate('/freelance/projects')
        } else if (userType === 'recruiter') {
          navigate('/app/recruiter/dashboard')
        } else {
          navigate('/app/dashboard')
        }
      } catch (error: any) {
        console.error('Error updating user type:', error)
        setError('Une erreur est survenue. Veuillez réessayer.')
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Mettre à jour le type d'utilisateur si ce n'est pas déjà fait
      if (!user.user_type) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ user_type: userType })
          .eq('id', user.id)

        if (updateError) throw updateError
      }

      // Sélectionner le bon ID de prix en fonction de la fréquence
      const selectedPriceId = frequency === 'yearly' 
        ? selectedPlans.find(p => p.name.toLowerCase() === planName.toLowerCase())?.yearlyPriceId || priceId
        : priceId

      // Créer une session de paiement Stripe
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          userId: user.id, 
          priceId: selectedPriceId, 
          userType: userType 
        }
      })

      if (error) throw error

      // Rediriger vers Stripe Checkout
      window.location.href = data.url
    } catch (error: any) {
      console.error('Error subscribing:', error)
      setError('Une erreur est survenue lors de la souscription. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-24 flex flex-col items-center px-4">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-primary-400 to-secondary-400 text-transparent bg-clip-text mb-6">
          Choisissez votre plan
        </h1>
        <p className="text-lg text-gray-400 mb-8">
          Trouvez le plan qui correspond à vos besoins et commencez à optimiser votre recherche d'emploi dès aujourd'hui.
        </p>
        
        {user?.trial_ends_at && new Date(user.trial_ends_at) > new Date() && (
          <div className="bg-primary-600/20 text-primary-400 p-4 rounded-lg inline-block">
            <p className="text-lg">
              Période d'essai active jusqu'au{' '}
              {new Date(user.trial_ends_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        )}
        
        {/* Sélecteur de type d'utilisateur */}
        <div className="mt-8 flex justify-center">
          <div className="relative flex rounded-full bg-white/5 p-1">
            <button
              type="button"
              className={`${
                userType === 'candidate' ? 'bg-primary-600 text-white' : 'text-gray-400'
              } rounded-full py-2 px-6 text-sm font-semibold transition-colors`}
              onClick={() => setUserType('candidate')}
            >
              Candidat
            </button>
            <button
              type="button"
              className={`${
                userType === 'freelancer' ? 'bg-primary-600 text-white' : 'text-gray-400'
              } rounded-full py-2 px-6 text-sm font-semibold transition-colors`}
              onClick={() => setUserType('freelancer')}
            >
              Freelance
            </button>
            <button
              type="button"
              className={`${
                userType === 'recruiter' ? 'bg-primary-600 text-white' : 'text-gray-400'
              } rounded-full py-2 px-6 text-sm font-semibold transition-colors`}
              onClick={() => setUserType('recruiter')}
            >
              Recruteur
            </button>
          </div>
        </div>
        
        {/* Sélecteur de fréquence */}
        <div className="mt-8 flex justify-center">
          <div className="relative flex rounded-full bg-white/5 p-1">
            <button
              type="button"
              className={`${
                frequency === 'monthly' ? 'bg-primary-600 text-white' : 'text-gray-400'
              } rounded-full py-2 px-6 text-sm font-semibold transition-colors`}
              onClick={() => setFrequency('monthly')}
            >
              Mensuel
            </button>
            <button
              type="button"
              className={`${
                frequency === 'yearly' ? 'bg-primary-600 text-white' : 'text-gray-400'
              } rounded-full py-2 px-6 text-sm font-semibold transition-colors`}
              onClick={() => setFrequency('yearly')}
            >
              Annuel <span className="text-primary-400 ml-1">-20%</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
        {selectedPlans.map((plan) => (
          <motion.div
            key={plan.name}
            className="bg-white/5 rounded-2xl p-8 flex flex-col shadow-lg"
            whileHover={{ scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center gap-3 mb-4">
              {plan.name === 'Free' ? (
                <UserIcon className="w-8 h-8 text-primary-400" />
              ) : plan.name === 'Pro' || plan.name === 'Business' ? (
                <BriefcaseIcon className="w-8 h-8 text-primary-400" />
              ) : (
                <DocumentTextIcon className="w-8 h-8 text-primary-400" />
              )}
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
            </div>
            <div className="flex items-baseline gap-2 mt-4 mb-2">
              <span className="text-4xl font-extrabold tracking-tight text-white">
                {frequency === 'yearly'
                  ? plan.yearlyPrice !== undefined
                    ? formatPrice(plan.yearlyPrice)
                    : '—'
                  : formatPrice(plan.price)}
              </span>
              <span className="text-gray-400 text-base font-semibold">
                {frequency === 'yearly' ? '/an' : '/mois'}
              </span>
            </div>
            <p className="text-gray-400 mb-4">{plan.description}</p>
            <ul className="mb-6 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center text-gray-300">
                  <CheckIcon className="w-5 h-5 text-primary-400 mr-2" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              {/* BOUTONS PAR OFFRE */}
              {plan.name === 'Free' && (
                <>
                  <button
                    onClick={() => handleSubscribe(plan.name.toLowerCase(), plan.priceId)}
                    disabled={loading || currentPlan === plan.name.toLowerCase() || freeTrialUsed}
                    className={`w-full btn-primary ${
                      currentPlan === plan.name.toLowerCase() || freeTrialUsed
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {freeTrialUsed
                      ? 'Essai déjà utilisé'
                      : currentPlan === plan.name.toLowerCase()
                      ? 'Plan actuel'
                      : loading
                      ? 'Chargement...'
                      : 'Commencer gratuitement'}
                  </button>
                  {freeTrialUsed && (
                    <div className="text-xs text-red-400 mt-2 text-center">
                      Vous avez déjà bénéficié de l’essai gratuit de 24h.
                    </div>
                  )}
                </>
              )}
              {plan.name === 'Enterprise' && (
                <button
                  onClick={() => setShowContactModal(true)}
                  disabled={loading}
                  className="w-full btn-primary"
                >
                  Contacter les ventes
                </button>
              )}
              {plan.name !== 'Free' && plan.name !== 'Enterprise' && (
                <button
                  onClick={() => handleSubscribe(plan.name.toLowerCase(), plan.priceId)}
                  disabled={loading || currentPlan === plan.name.toLowerCase()}
                  className={`w-full btn-primary ${
                    currentPlan === plan.name.toLowerCase()
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {currentPlan === plan.name.toLowerCase()
                    ? 'Plan actuel'
                    : loading
                    ? 'Chargement...'
                    : 'S’abonner'}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {error && (
        <div className="mt-8 p-4 bg-red-900/50 text-red-400 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="mt-16 max-w-3xl mx-auto text-center">
        <h3 className="text-2xl font-bold text-white mb-4">Questions fréquentes</h3>
        <dl className="space-y-6 divide-y divide-white/10">
          {faqs.map((faq) => (
            <div key={faq.question} className="pt-6">
              <dt className="text-lg font-medium text-white">{faq.question}</dt>
              <dd className="mt-2 text-base text-gray-400">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
      <ContactSalesModal open={showContactModal} onClose={() => setShowContactModal(false)} />
    </div>
  )
}

const faqs = [
  {
    question: 'Puis-je annuler mon abonnement à tout moment ?',
    answer: 'Oui, vous pouvez annuler votre abonnement à tout moment. Vous continuerez à avoir accès aux fonctionnalités premium jusqu\'à la fin de votre période de facturation.',
  },
  {
    question: 'Comment fonctionne la période d\'essai gratuite ?',
    answer: 'Vous bénéficiez d\'une période d\'essai de 24 heures pour tester toutes les fonctionnalités premium. Aucune carte bancaire n\'est requise pour commencer l\'essai.',
  },
  {
    question: 'Y a-t-il des frais supplémentaires ?',
    answer: 'Non, le prix affiché inclut toutes les fonctionnalités du plan. Il n\'y a pas de frais cachés ou supplémentaires.',
  },
  {
    question: 'Puis-je changer de plan ?',
    answer: 'Oui, vous pouvez passer à un plan supérieur à tout moment. Si vous souhaitez passer à un plan inférieur, le changement prendra effet à la fin de votre période de facturation actuelle.',
  },
  {
    question: 'Comment sont protégées mes données personnelles ?',
    answer: 'Nous prenons la protection de vos données très au sérieux. Toutes vos informations sont chiffrées et stockées en toute sécurité. Nous ne partageons jamais vos données avec des tiers sans votre consentement explicite.',
  },
]

// Ajout de l'icône CheckIcon manquante
function CheckIcon(props) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth={1.5} 
      stroke="currentColor" 
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

export default Pricing;
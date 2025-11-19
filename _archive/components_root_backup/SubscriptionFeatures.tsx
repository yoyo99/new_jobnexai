import { CheckIcon } from '@heroicons/react/24/outline'

interface SubscriptionFeaturesProps {
  plan: 'free' | 'pro' | 'enterprise'
}

export function SubscriptionFeatures({ plan }: SubscriptionFeaturesProps) {
  // Définir les fonctionnalités disponibles pour chaque plan
  const features = {
    free: [
      'Recherche d\'emploi basique',
      'CV builder limité',
      'Maximum 5 candidatures par mois',
      'Accès limité aux analyses de marché',
      'Pas de suggestions personnalisées',
    ],
    pro: [
      'Recherche d\'emploi avancée avec filtres',
      'CV builder illimité avec IA',
      'Candidatures illimitées',
      'Suivi des candidatures',
      'Analyses et statistiques complètes',
      'Suggestions d\'emploi personnalisées',
      'Alertes emploi personnalisées',
      'Réseau professionnel',
    ],
    enterprise: [
      'Tout le plan Pro',
      'Support prioritaire',
      'API access',
      'Intégration ATS',
      'Formation personnalisée',
      'Analyses avancées du marché',
      'Coaching carrière personnalisé',
      'Accès anticipé aux nouvelles fonctionnalités',
    ],
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Fonctionnalités incluses</h3>
      <ul className="space-y-2">
        {features[plan].map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-gray-300">
            <CheckIcon className="h-5 w-5 flex-none text-primary-400 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}